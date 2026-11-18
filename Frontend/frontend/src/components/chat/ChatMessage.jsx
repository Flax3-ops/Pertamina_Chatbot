import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
  Download,
  ExternalLink,
} from "lucide-react";
import "./ChatMessage.css";

// ── Tool Call Card ────────────────────────────────────────────────────────────

const TOOL_ICONS = {
  search_tool: Globe,
  fetch_full_documents: FileText,
  fetch_relevant_documents: FileText,
  create_rks_document: FileText,
  convert_pdf_to_docx: FileText,
  generate_amendment_document: Wrench,
};

const TOOL_LABELS = {
  search_tool: "Pencarian Internet",
  fetch_full_documents: "Ambil Dokumen Lengkap",
  fetch_relevant_documents: "Ambil Dokumen Relevan",
  create_rks_document: "Buat Dokumen RKS",
  convert_pdf_to_docx: "Konversi ke DOCX",
  generate_amendment_document: "Buat Dokumen Amandemen",
};

function ToolCallCard({ tool }) {
  const [open, setOpen] = useState(false);
  const Icon = TOOL_ICONS[tool.name] || Wrench;
  const label = TOOL_LABELS[tool.name] || tool.name;

  const statusIcon =
    tool.status === "done" ? (
      <CheckCircle size={13} className="tc-status-icon done" />
    ) : tool.status === "error" ? (
      <AlertCircle size={13} className="tc-status-icon error" />
    ) : (
      <Clock size={13} className="tc-status-icon running" />
    );

  let inputStr = "";
  let outputStr = "";
  try {
    const inp = tool.input;
    inputStr = typeof inp === "string" ? inp : JSON.stringify(inp, null, 2);
  } catch {
    inputStr = String(tool.input ?? "");
  }
  try {
    const out = tool.output;
    outputStr = typeof out === "string" ? out : JSON.stringify(out, null, 2);
  } catch {
    outputStr = String(tool.output ?? "");
  }

  return (
    <div className={`tool-card ${open ? "open" : ""}`}>
      <button className="tool-card-header" onClick={() => setOpen((o) => !o)}>
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
  );
}

// ── File Download Card Component ──────────────────────────────────────────────

function FileDownloadCard({ file }) {
  const isPdf = file.type === "pdf";
  return (
    <div className="chat-file-card">
      <div className={`chat-file-icon ${isPdf ? "pdf" : "docx"}`}>
        <FileText size={22} />
        <span className="file-badge">{isPdf ? "PDF" : "DOCX"}</span>
      </div>
      <div className="chat-file-info">
        <div className="chat-file-name" title={file.name}>
          {file.name}
        </div>
        <div className="chat-file-sub">
          {file.label ||
            (isPdf ? "Pratinjau Dokumen PDF" : "Dokumen Resmi Microsoft Word")}
        </div>
      </div>
      <a
        href={file.url}
        download={file.name}
        className="chat-file-download-btn"
        title={`Unduh ${file.name}`}
      >
        <Download size={14} />
        <span>Unduh</span>
      </a>
    </div>
  );
}

// ── Helper to extract generated files from tool calls and markdown ────────────

function extractDownloadableFiles(tool_calls = [], content = "") {
  const files = [];
  const seenUrls = new Set();

  // 1. Scan tool_calls outputs (convert_pdf_to_docx, create_rks_document, etc.)
  for (const tc of tool_calls) {
    if (!tc.output) continue;
    let parsed = null;
    if (typeof tc.output === "object") {
      parsed = tc.output;
    } else if (typeof tc.output === "string") {
      try {
        parsed = JSON.parse(tc.output);
      } catch {
        // Fallback: extract .docx filename from raw text output
        const docxMatch = tc.output.match(/([a-zA-Z0-9_\-.\s]+\.docx)/i);
        if (docxMatch) {
          const fn = docxMatch[1].trim();
          const url = `/api/download/${encodeURIComponent(fn)}`;
          if (!seenUrls.has(url)) {
            seenUrls.add(url);
            files.push({
              name: fn,
              url,
              type: "docx",
              label: "Dokumen Hasil Konversi Word",
            });
          }
        }
      }
    }

    if (parsed) {
      if (parsed.download_url && parsed.filename) {
        if (!seenUrls.has(parsed.download_url)) {
          seenUrls.add(parsed.download_url);
          files.push({
            name: parsed.filename,
            url: parsed.download_url,
            type: parsed.filename.toLowerCase().endsWith(".pdf")
              ? "pdf"
              : "docx",
            label: parsed.title || "Dokumen Hasil Konversi Word",
          });
        }
      } else if (parsed.artifact_id) {
        const docxUrl = `/api/rks/${parsed.artifact_id}/document.docx`;
        if (!seenUrls.has(docxUrl)) {
          seenUrls.add(docxUrl);
          files.push({
            name: `RKS-${parsed.artifact_id.slice(0, 8)}.docx`,
            url: docxUrl,
            type: "docx",
            label: "Draf Dokumen RKS Pertamina",
          });
        }
      } else if (parsed.filename) {
        const url = `/api/download/${encodeURIComponent(parsed.filename)}`;
        if (!seenUrls.has(url)) {
          seenUrls.add(url);
          files.push({
            name: parsed.filename,
            url,
            type: parsed.filename.toLowerCase().endsWith(".pdf")
              ? "pdf"
              : "docx",
            label: parsed.title || "Dokumen Hasil Konversi Word",
          });
        }
      }
    }
  }

  // 2. Scan Markdown content for links pointing to generated files
  const linkRegex =
    /\[([^\]]+)\]\(((\/api\/(?:download|rks|tender\/download)[^\)]+)|[^\)]+\.(?:docx|pdf))\)/gi;
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const label = match[1];
    const url = match[2];
    if (!seenUrls.has(url)) {
      seenUrls.add(url);
      const name = url.split("/").pop() || label;
      files.push({
        name,
        url,
        type: url.toLowerCase().endsWith(".pdf") ? "pdf" : "docx",
        label,
      });
    }
  }

  return files;
}

// ── Typing indicator ──────────────────────────────────────────────────────────

export function TypingIndicator() {
  return (
    <div className="chat-message ai fade-in">
      <div className="msg-avatar ai">
        <Bot size={16} />
      </div>
      <div className="msg-body">
        <div className="msg-bubble typing-bubble">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
        </div>
      </div>
    </div>
  );
}

// ── Main ChatMessage ──────────────────────────────────────────────────────────

export default function ChatMessage({ message }) {
  const { role, content, tool_calls = [] } = message;

  const isHuman = role === "human";
  const isAI = role === "ai";
  const downloadableFiles = isAI
    ? extractDownloadableFiles(tool_calls, content)
    : [];

  return (
    <div className={`chat-message ${isHuman ? "human" : "ai"} fade-in`}>
      <div className={`msg-avatar ${isHuman ? "human" : "ai"}`}>
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

        {/* Dedicated File Download Cards */}
        {downloadableFiles.length > 0 && (
          <div className="chat-file-cards-group">
            {downloadableFiles.map((file, i) => (
              <FileDownloadCard key={i} file={file} />
            ))}
          </div>
        )}

        {/* Message text */}
        {content && (
          <div className={`msg-bubble ${isHuman ? "human" : "ai"}`}>
            {isHuman ? (
              <span className="msg-text">{content}</span>
            ) : (
              <div className="prose">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ node, href, children, ...props }) => {
                      const isDownload =
                        href &&
                        (href.startsWith("/api/") ||
                          href.match(/\.(docx|pdf)$/i));
                      if (isDownload) {
                        return (
                          <a
                            href={href}
                            download
                            className="inline-download-link"
                            {...props}
                          >
                            <Download size={13} />
                            <span>{children}</span>
                          </a>
                        );
                      }
                      return (
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          {...props}
                        >
                          {children}
                        </a>
                      );
                    },
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
