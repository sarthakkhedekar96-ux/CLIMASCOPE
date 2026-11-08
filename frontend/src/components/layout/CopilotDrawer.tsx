import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Send,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  FileText,
  Lock,
  Award,
  Copy,
  Check,
  RotateCcw,
  Layers,
  HardHat,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  TrendingDown,
  Droplets,
  Calendar,
  Zap,
} from 'lucide-react';
import {
  WardSummary,
  WorkflowPhase,
  CopilotQueryResponse,
  CopilotEvidenceRef,
} from '../../types/api';
import { api } from '../../services/api';

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  ward: WardSummary | null;
  currentPhase: WorkflowPhase;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  responsePayload?: CopilotQueryResponse;
  loading?: boolean;
}

const DEFAULT_QUESTIONS = [
  'Which ward has the highest climate debt?',
  'Why is Ward 14 at critical risk?',
  'Which intervention should be prioritized?',
  'How should a 5 crore budget be distributed?',
  'What happens if we increase the tree coverage?',
  'Which interventions are still pending verification?',
  'Which wards have the highest population vulnerability?',
];

export const CopilotDrawer: React.FC<CopilotDrawerProps> = ({
  isOpen,
  onClose,
  ward,
  currentPhase,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStage, setLoadingStage] = useState('QUERYING CLIMATE INTELLIGENCE...');
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(DEFAULT_QUESTIONS);
  const [expandedEvidence, setExpandedEvidence] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize with authoritative welcome briefing
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome-msg',
          sender: 'assistant',
          text: `Welcome, Commissioner. I am your **CLIMASCOPE AI Climate Copilot**, an intelligence assistant deeply integrated with the complete Pune Municipal Corporation (PMC) environmental data platform.\n\nAll my analytical explanations and budget recommendations are calculated deterministically using the **Climate Debt Engine**, **0/1 Knapsack MILP Optimizer**, **Urban Climate Twin**, and **Copernicus/Landsat Satellite Radiometry**. Currently contextualized for **${
            ward ? `${ward.name} (${ward.code})` : 'Pune Metropolitan Region'
          }**.\n\nSelect a municipal inquiry below or ask any specific climate question:`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [ward]);

  // Load contextual suggested questions when ward or phase changes
  useEffect(() => {
    api
      .getCopilotSuggestedQuestions(ward?.id, currentPhase)
      .then((res) => {
        if (res.success && res.data && res.data.suggested_questions.length > 0) {
          setSuggestedQuestions(res.data.suggested_questions);
        }
      })
      .catch(() => {
        setSuggestedQuestions(DEFAULT_QUESTIONS);
      });
  }, [ward, currentPhase]);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSubmitting]);

  // Focus input on drawer open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleEvidence = (evId: string) => {
    setExpandedEvidence((prev) => {
      const next = new Set(prev);
      if (next.has(evId)) {
        next.delete(evId);
      } else {
        next.add(evId);
      }
      return next;
    });
  };

  const handleSend = async (queryText?: string) => {
    const q = queryText || input;
    if (!q.trim() || isSubmitting) return;

    const userMessageId = `user-${Date.now()}`;
    const assistantMessageId = `asst-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append user query and temporary loading message
    setMessages((prev) => [
      ...prev,
      {
        id: userMessageId,
        sender: 'user',
        text: q,
        timestamp,
      },
      {
        id: assistantMessageId,
        sender: 'assistant',
        text: '',
        timestamp,
        loading: true,
      },
    ]);

    setInput('');
    setIsSubmitting(true);

    // Dynamic loading status indicator
    setLoadingStage('IDENTIFYING MUNICIPAL INTENT...');
    const t1 = setTimeout(() => setLoadingStage('RETRIEVING APPLICATION TELEMETRY...'), 250);
    const t2 = setTimeout(() => setLoadingStage('EXECUTING BIOPHYSICAL MODELS & KNAPSACK MILP...'), 600);
    const t3 = setTimeout(() => setLoadingStage('SYNTHESIZING EXECUTIVE BRIEF...'), 1000);

    try {
      const res = await api.queryCopilot({
        query: q,
        ward_id: ward?.id,
        current_phase: currentPhase,
      });

      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);

      if (res.success && res.data) {
        const payload = res.data;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  text: payload.response_text,
                  responsePayload: payload,
                  loading: false,
                }
              : msg
          )
        );
      } else {
        throw new Error(res.message || 'Failed to process inquiry');
      }
    } catch (err: any) {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                text: `**Municipal Intelligence Service Notice**: Unable to complete the requested query at this moment (${err.message || 'Connection timeout'}). Please verify the server connection and try again.`,
                loading: false,
              }
            : msg
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: `Conversation memory reset. Grounded analytical session re-initialized for **${
          ward ? `${ward.name} (${ward.code})` : 'Pune Metropolitan Region'
        }**. How may I assist your municipal climate decision-making?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] lg:w-[560px] bg-white border-l border-[#E1E9DF] shadow-2xl z-50 flex flex-col text-xs select-none">
      {/* 1. Header Banner */}
      <div className="p-4 bg-gradient-to-r from-[#062A13] via-[#073B1A] to-[#062A13] text-white flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#32A817]/20 border border-[#32A817] flex items-center justify-center text-[#48B52B] shadow">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-wider flex items-center gap-2">
              <span>AI CLIMATE COPILOT</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#32A817] text-white font-semibold">
                PMC RESILIENCE
              </span>
            </div>
            <div className="text-[11px] text-[#A3C999] flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#32A817] animate-ping" />
              <span>GROUNDED ANALYTICS</span>
              <span className="text-white/40">•</span>
              <span>
                CONTEXT: <strong className="text-white">{ward?.code || 'PUNE'}</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleResetChat}
            className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            title="Reset Conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            title="Close Copilot"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Suggested Prompt Buttons Carousel */}
      <div className="p-3 border-b border-[#E1E9DF] bg-[#EDF5E9] space-y-2">
        <div className="flex items-center justify-between text-[10px] text-[#667568] uppercase font-bold tracking-wider">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-[#32A817]" />
            <span>Suggested Municipal Inquiries</span>
          </span>
          <span className="text-[#879487] text-[10px]">Click to analyze</span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              disabled={isSubmitting}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-white hover:bg-[#E2EEDF] text-[#073B1A] border border-[#C8DEC2] text-[11px] font-medium transition-all text-left truncate max-w-[280px] shadow-sm"
              title={q}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin bg-[#F5F7F2]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col space-y-1 ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            {/* Sender Label & Timestamp */}
            <div className="flex items-center gap-2 px-1 text-[10px] text-[#667568]">
              {msg.sender === 'assistant' ? (
                <span className="text-[#073B1A] font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#32A817]" /> CLIMASCOPE ANALYST
                </span>
              ) : (
                <span className="text-[#17251A] font-semibold">MUNICIPAL OFFICER</span>
              )}
              <span>•</span>
              <span>{msg.timestamp}</span>
              {msg.responsePayload && (
                <>
                  <span>•</span>
                  <span className="text-emerald-700 font-bold">
                    {(msg.responsePayload.confidence * 100).toFixed(0)}% CONFIDENCE
                  </span>
                  <span>•</span>
                  <span className="text-[#879487]">{msg.responsePayload.execution_time_ms}ms</span>
                </>
              )}
            </div>

            {/* Bubble Container */}
            <div
              className={`rounded-2xl p-4 max-w-[95%] space-y-3 leading-relaxed shadow-card transition-all ${
                msg.sender === 'user'
                  ? 'bg-[#073B1A] text-white rounded-tr-none'
                  : 'bg-white text-[#17251A] border border-[#E1E9DF] rounded-tl-none'
              }`}
            >
              {/* If Loading Indicator */}
              {msg.loading ? (
                <div className="py-2 space-y-2">
                  <div className="flex items-center gap-2 text-[#073B1A] font-semibold text-xs">
                    <span className="w-2 h-2 rounded-full bg-[#32A817] animate-ping" />
                    <span className="tracking-wider">{loadingStage}</span>
                  </div>
                  <div className="w-full bg-[#EDF5E9] rounded-full h-1.5 overflow-hidden">
                    <div className="bg-[#32A817] h-full rounded-full animate-pulse w-3/4" />
                  </div>
                </div>
              ) : (
                <>
                  {/* Executive Summary Callout (if present on assistant response) */}
                  {msg.responsePayload?.executive_summary && (
                    <div className="p-3 rounded-xl bg-[#EDF5E9] border border-[#C8DEC2] text-[#073B1A] text-xs space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#073B1A] flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#32A817]" />
                        <span>Executive Synthesis</span>
                      </div>
                      <p className="leading-relaxed text-[#17251A]">{msg.responsePayload.executive_summary}</p>
                    </div>
                  )}

                  {/* Main Formatted Markdown Content */}
                  <div className="font-sans text-xs space-y-2 leading-relaxed select-text">
                    {msg.text.split('\n\n').map((paragraph, pIdx) => {
                      // Check for Markdown table
                      if (paragraph.includes('|') && paragraph.includes('\n|')) {
                        const rows = paragraph.trim().split('\n');
                        const headers = rows[0]
                          .split('|')
                          .map((h) => h.trim())
                          .filter((h) => h);
                        const bodyRows = rows
                          .slice(2)
                          .map((r) =>
                            r
                              .split('|')
                              .map((c) => c.trim())
                              .filter((c) => c)
                          );

                        return (
                          <div
                            key={pIdx}
                            className="my-2 border border-[#E1E9DF] rounded-xl overflow-hidden"
                          >
                            <table className="w-full text-left font-mono text-[10px] border-collapse">
                              <thead>
                                <tr className="bg-[#EDF5E9] border-b border-[#E1E9DF] text-[#073B1A]">
                                  {headers.map((h, hIdx) => (
                                    <th key={hIdx} className="p-2 font-bold">
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#E1E9DF]">
                                {bodyRows.map((row, rIdx) => (
                                  <tr key={rIdx} className="hover:bg-[#F5F7F2]">
                                    {row.map((cell, cIdx) => (
                                      <td key={cIdx} className="p-2 text-[#17251A]">
                                        {cell.replace(/`/g, '')}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      }

                      // Check for markdown subheadings
                      if (paragraph.startsWith('### ')) {
                        return (
                          <h4
                            key={pIdx}
                            className="text-[#073B1A] font-bold text-sm tracking-tight border-b border-[#E1E9DF] pb-1 mt-2 font-sans"
                          >
                            {paragraph.replace('### ', '')}
                          </h4>
                        );
                      }

                      // Check for bullet list items
                      if (paragraph.startsWith('- ') || paragraph.includes('\n- ')) {
                        const items = paragraph.split('\n- ').map((item) => item.replace(/^- /, ''));
                        return (
                          <ul key={pIdx} className="space-y-1 my-1 pl-3 list-disc">
                            {items.map((item, iIdx) => (
                              <li key={iIdx} className="leading-relaxed">
                                {renderFormattedText(item, msg.sender)}
                              </li>
                            ))}
                          </ul>
                        );
                      }

                      // Numbered lists
                      if (/^\d+\.\s/.test(paragraph) || paragraph.includes('\n  ')) {
                        return (
                          <div
                            key={pIdx}
                            className="p-3 bg-[#EDF5E9] border border-[#E1E9DF] rounded-xl space-y-1 text-[11px]"
                          >
                            {paragraph.split('\n').map((line, lIdx) => (
                              <div key={lIdx} className="leading-relaxed">
                                {renderFormattedText(line, msg.sender)}
                              </div>
                            ))}
                          </div>
                        );
                      }

                      return (
                        <p key={pIdx} className="leading-relaxed">
                          {renderFormattedText(paragraph, msg.sender)}
                        </p>
                      );
                    })}
                  </div>

                  {/* Key Metrics Chips (if available) */}
                  {msg.responsePayload?.key_metrics &&
                    Object.keys(msg.responsePayload.key_metrics).length > 0 && (
                      <div className="pt-2 border-t border-[#E1E9DF] grid grid-cols-2 gap-2 font-mono text-[10px]">
                        {Object.entries(msg.responsePayload.key_metrics).map(([k, val], kIdx) => (
                          <div
                            key={kIdx}
                            className="p-2 bg-[#EDF5E9] border border-[#E1E9DF] rounded-xl flex justify-between items-center"
                          >
                            <span className="text-[#667568] uppercase truncate font-medium">
                              {k.replace(/_/g, ' ')}:
                            </span>
                            <span className="text-[#073B1A] font-bold ml-1">
                              {typeof val === 'number'
                                ? val.toLocaleString(undefined, { maximumFractionDigits: 1 })
                                : String(val)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                  {/* Supporting Evidence References */}
                  {msg.responsePayload?.evidence_references &&
                    msg.responsePayload.evidence_references.length > 0 && (
                      <div className="pt-2 border-t border-[#E1E9DF] space-y-1.5 font-mono text-[10px]">
                        <div className="text-[#073B1A] font-bold uppercase tracking-wider flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-[#32A817]" />
                            <span>
                              CITED EVIDENCE ({msg.responsePayload.evidence_references.length} RECORDS)
                            </span>
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {msg.responsePayload.evidence_references.map((ev, evIdx) => {
                            const isExpanded = expandedEvidence.has(ev.evidence_id);
                            return (
                              <div
                                key={evIdx}
                                className="bg-[#F5F7F2] border border-[#E1E9DF] rounded-xl p-2.5 space-y-1"
                              >
                                <div
                                  onClick={() => toggleEvidence(ev.evidence_id)}
                                  className="flex items-center justify-between cursor-pointer"
                                >
                                  <span className="text-[#073B1A] font-bold flex items-center gap-1">
                                    {isExpanded ? (
                                      <ChevronDown className="w-3 h-3 text-[#667568]" />
                                    ) : (
                                      <ChevronRight className="w-3 h-3 text-[#667568]" />
                                    )}
                                    {ev.evidence_id} • {ev.evidence_type}
                                  </span>
                                  <span className="text-emerald-700 font-bold">
                                    {(ev.confidence * 100).toFixed(0)}% Conf
                                  </span>
                                </div>

                                {isExpanded && (
                                  <div className="pt-1.5 border-t border-[#E1E9DF] space-y-1 text-[#667568]">
                                    <p className="text-[#17251A] leading-relaxed">
                                      {ev.description}
                                    </p>
                                    <div className="flex justify-between text-[#879487] text-[9px]">
                                      <span>Source: {ev.source}</span>
                                      <span>Observed: {ev.observation_date}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  {/* Missing Information / Observational Gaps */}
                  {msg.responsePayload?.missing_information &&
                    msg.responsePayload.missing_information.length > 0 && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[10px] space-y-1">
                        <div className="text-amber-800 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>OBSERVATIONAL GAPS & MISSING TELEMETRY</span>
                        </div>
                        <ul className="list-disc pl-3 text-amber-900/80 space-y-0.5">
                          {msg.responsePayload.missing_information.map((gap, gIdx) => (
                            <li key={gIdx}>{gap}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {/* Suggested Follow-up Actions */}
                  {msg.responsePayload?.suggested_actions &&
                    msg.responsePayload.suggested_actions.length > 0 && (
                      <div className="pt-1.5 border-t border-[#E1E9DF] flex items-center justify-between gap-1 text-[10px]">
                        <span className="text-[#667568] font-medium">Suggested Action:</span>
                        <span className="text-[#073B1A] truncate font-semibold">
                          {msg.responsePayload.suggested_actions[0]}
                        </span>
                      </div>
                    )}

                  {/* Card Footer: Copy Response */}
                  {msg.sender === 'assistant' && (
                    <div className="flex items-center justify-between pt-2 border-t border-[#E1E9DF] text-[9px] text-[#879487]">
                      <span>PMC Grounded Model • Deterministic</span>
                      <button
                        onClick={() => copyToClipboard(msg.text, msg.id)}
                        className="text-[#667568] hover:text-[#17251A] flex items-center gap-1 p-0.5"
                        title="Copy Response"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 font-semibold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 4. Input Bar */}
      <div className="p-4 border-t border-[#E1E9DF] bg-white space-y-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isSubmitting}
            placeholder={`Ask about climate debt, risk drivers, or budget in ${ward?.code || 'Pune'}...`}
            className="flex-1 bg-[#F5F7F2] border border-[#E1E9DF] rounded-xl px-3.5 py-2.5 text-xs text-[#17251A] placeholder-[#879487] focus:outline-none focus:border-[#32A817] transition-colors"
          />

          <button
            type="submit"
            disabled={!input.trim() || isSubmitting}
            className="p-2.5 rounded-xl bg-[#32A817] hover:bg-[#288712] disabled:bg-[#EDF5E9] disabled:text-[#879487] text-white font-semibold transition-all shadow-sm"
            title="Send Inquiry"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-between text-[10px] text-[#879487] px-1">
          <span>Grounded in deterministic models • ISO 14064 Compliant</span>
          <span className="text-[#073B1A] font-semibold">PMC COPILOT v1.0</span>
        </div>
      </div>
    </div>
  );
};

// Helper for rendering bold spans and code markers inside text
function renderFormattedText(text: string, sender: 'user' | 'assistant') {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className={sender === 'user' ? 'text-white font-bold' : 'text-[#073B1A] font-bold'}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={idx} className="px-1.5 py-0.5 rounded bg-[#EDF5E9] text-[#073B1A] font-mono text-[10px]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
