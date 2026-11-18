import React, { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  ChevronDown,
  ChevronRight,
  Search,
  FileText,
  Globe,
  Wrench,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Bot,
} from 'lucide-react'
import './ChatMessage.css'

// ── Tool Call Card ────────────────────────────────────────────────────────────

const TOOL_ICONS = {
  search_tool: Globe,
  fetch_full_documents: FileText,
  fetch_relevant_documents: FileText,
  create_rks_document: FileText,
  convert_pdf_to_docx: FileText,
  generate_amendment_document: Wrench,
}

const TOOL_LABELS = {
  search_tool: 'Pencarian Internet',
  fetch_full_documents: 'Ambil Dokumen Lengkap',
  fetch_relevant_documents: 'Ambil Dokumen Relevan',
  create_rks_document: 'Buat Dokumen RKS',
  convert_pdf_to_docx: 'Konversi ke DOCX',
  generate_amendment_document: 'Buat Dokumen Amandemen',
}

function ToolCallCard({ tool }) {
  const [open, setOpen] = useState(false)
  const Icon = TOOL_ICONS[tool.name] || Wrench
  const label = TOOL_LABELS[tool.name] || tool.name

  const statusIcon = tool.status === 'done'
    ? <CheckCircle size={13} className="tc-status-icon done" />
    : tool.status === 'error'
    ? <AlertCircle size={13} className="tc-status-icon error" />
    : <Clock size={13} className="tc-status-icon running" />

  let inputStr = ''
  let outputStr = ''
  try {
    const inp = tool.input
    inputStr = typeof inp === 'string' ? inp : JSON.stringify(inp, null, 2)
  } catch { inputStr = String(tool.input ?? '') }
  try {
    const out = tool.output
    outputStr = typeof out === 'string' ? out : JSON.stringify(out, null, 2)
  } catch { outputStr = String(tool.output ?? '') }

  return (
    <div className={`tool-card ${open ? 'open' : ''}`}>
      <button className="tool-card-header" onClick={() => setOpen(o => !o)}>
        <span className="tool-card-left">
          <span className="tool-card-icon-wrap">
            <Icon size={14} />
          </span>
          <span className="tool-card-label">{label}</span>
          {statusIcon}
        </span>
        <span className="tool-card-chevron">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>

      {open && (
        <div className="tool-card-body">
          <div className="tool-card-section">
            <div className="tool-card-section-title">
              <Search size={11} /> Input
            </div>
            <pre className="tool-card-code">{inputStr}</pre>
          </div>
          {outputStr && (
            <div className="tool-card-section">
              <div className="tool-card-section-title">
                <CheckCircle size={11} /> Output
              </div>
              <pre className="tool-card-code output">{outputStr}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Typing indicator ──────────────────────────────────────────────────────────

export function TypingIndicator() {
  return (
    <div className="chat-message ai fade-in">
      <div className="msg-avatar ai"><Bot size={16} /></div>
      <div className="msg-body">
        <div className="msg-bubble typing-bubble">
          <span className="dot" /><span className="dot" /><span className="dot" />
        </div>
      </div>
    </div>
  )
}

// ── Main ChatMessage ──────────────────────────────────────────────────────────

export default function ChatMessage({ message }) {
  const { role, content, tool_calls = [] } = message

  const isHuman = role === 'human'
  const isAI = role === 'ai'

  return (
    <div className={`chat-message ${isHuman ? 'human' : 'ai'} fade-in`}>
      <div className={`msg-avatar ${isHuman ? 'human' : 'ai'}`}>
        {isHuman ? <User size={16} /> : <Bot size={16} />}
      </div>

      <div className="msg-body">
        {/* Tool calls (shown above AI response text) */}
        {tool_calls.length > 0 && (
          <div className="tool-calls-group">
            {tool_calls.map((tc, i) => (
              <ToolCallCard key={i} tool={tc} />
            ))}
          </div>
        )}

        {/* Message text */}
        {content && (
          <div className={`msg-bubble ${isHuman ? 'human' : 'ai'}`}>
            {isHuman ? (
              <span className="msg-text">{content}</span>
            ) : (
              <div className="prose">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
