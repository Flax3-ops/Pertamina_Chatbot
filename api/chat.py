"""
Chat API endpoints – bridges the React frontend to the LangGraph agent.

Endpoints:
  POST /api/chat                        – send a message, get back all messages incl. tool calls
  GET  /api/chat/threads                – list conversation threads
  POST /api/chat/threads                – create a new thread
  GET  /api/chat/threads/{id}/messages  – fetch messages for a thread
  DELETE /api/chat/threads/{id}         – delete a thread
  PATCH  /api/chat/threads/{id}         – rename a thread
"""

from __future__ import annotations

import json
import os
import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/chat", tags=["chat"])

# ── Lazy imports (heavy deps loaded only on first request) ────────────────────

_agent_app = None
_store: "ConversationStore | None" = None

OWNER_TOKEN = "api-user"  # single-user open-access mode


def _get_agent():
    global _agent_app
    if _agent_app is None:
        from agent import app as langgraph_app  # type: ignore
        _agent_app = langgraph_app
    return _agent_app


def _get_store() -> "ConversationStore":
    global _store
    if _store is None:
        from rag.conversation_store import ConversationStore  # type: ignore
        _store = ConversationStore(owner_token=OWNER_TOKEN, single_user=True)
        try:
            _store.initialize()
        except Exception:
            pass
    return _store


# ── Helpers ──────────────────────────────────────────────────────────────────

def _serialise_messages(messages) -> List[Dict[str, Any]]:
    """
    Convert LangChain message objects into a JSON-safe list that the React
    frontend can render.  Tool calls and tool outputs are merged so that each
    AIMessage carries its tool_calls with their outputs.
    """
    from langchain_core.messages import HumanMessage, AIMessage, ToolMessage, SystemMessage

    # Build a tool-output lookup: tool_call_id → content
    tool_outputs: Dict[str, str] = {}
    for msg in messages:
        if isinstance(msg, ToolMessage):
            tool_outputs[msg.tool_call_id] = msg.content

    result = []
    for msg in messages:
        if isinstance(msg, SystemMessage):
            continue  # skip system prompts

        if isinstance(msg, HumanMessage):
            result.append({
                "role": "human",
                "content": msg.content if isinstance(msg.content, str) else json.dumps(msg.content, ensure_ascii=False),
                "tool_calls": [],
            })

        elif isinstance(msg, AIMessage):
            # Gather tool calls
            tcs = []
            for tc in (msg.tool_calls or []):
                tc_id = tc.get("id", "")
                tcs.append({
                    "id": tc_id,
                    "name": tc.get("name", ""),
                    "input": tc.get("args", {}),
                    "output": tool_outputs.get(tc_id),
                    "status": "done" if tc_id in tool_outputs else "running",
                })

            text_content = msg.content
            if not isinstance(text_content, str):
                text_content = json.dumps(text_content, ensure_ascii=False)

            result.append({
                "role": "ai",
                "content": text_content,
                "tool_calls": tcs,
            })

        elif isinstance(msg, ToolMessage):
            pass  # already merged into the preceding AIMessage's tool_calls

    return result


# ── Request/Response models ───────────────────────────────────────────────────

class ChatRequest(BaseModel):
    thread_id: Optional[str] = None
    message: str


class CreateThreadRequest(BaseModel):
    title: str = "Percakapan Baru"


class RenameThreadRequest(BaseModel):
    title: str


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("")
async def chat(req: ChatRequest):
    """
    Send a user message to the LangGraph agent and return the full updated
    conversation (including tool calls with outputs).
    """
    from langchain_core.messages import HumanMessage

    agent = _get_agent()
    store = _get_store()

    thread_id = req.thread_id or str(uuid.uuid4())
    is_new = req.thread_id is None

    # Ensure thread exists in DB
    title = req.message[:60].strip().replace("\n", " ") or "Percakapan Baru"
    try:
        if is_new:
            store.create_thread(thread_id, title)
        else:
            store.ensure_thread(thread_id, title)
    except Exception:
        pass

    # Load history & add new user message
    try:
        history = store.load_messages(thread_id)
    except Exception:
        history = []

    history.append(HumanMessage(content=req.message))

    # Run agent (LangGraph MemorySaver uses thread_id as config key)
    config = {"configurable": {"thread_id": thread_id}}
    try:
        result = agent.invoke({"messages": history}, config=config)
        new_messages = result.get("messages", history)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Agent error: {exc}") from exc

    # Persist to DB
    try:
        store.save_messages(thread_id, new_messages)
    except Exception:
        pass

    return {
        "thread_id": thread_id,
        "messages": _serialise_messages(new_messages),
    }


@router.get("/threads")
def list_threads():
    store = _get_store()
    try:
        threads = store.list_threads()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    return {"threads": threads}


@router.post("/threads")
def create_thread(req: CreateThreadRequest):
    store = _get_store()
    thread_id = str(uuid.uuid4())
    try:
        store.create_thread(thread_id, req.title)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    return {"id": thread_id, "title": req.title}


@router.get("/threads/{thread_id}/messages")
def get_messages(thread_id: str):
    store = _get_store()
    try:
        messages = store.load_messages(thread_id)
    except Exception as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return {"messages": _serialise_messages(messages)}


@router.delete("/threads/{thread_id}")
def delete_thread(thread_id: str):
    store = _get_store()
    try:
        store.delete_thread(thread_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    return {"status": "deleted"}


@router.patch("/threads/{thread_id}")
def rename_thread(thread_id: str, req: RenameThreadRequest):
    store = _get_store()
    try:
        store.rename_thread(thread_id, req.title)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    return {"status": "renamed", "title": req.title}
