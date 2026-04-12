'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  ChevronDown, ChevronUp, Play, RotateCcw, Loader2,
  AlertCircle, AlertTriangle, CheckCircle2, Receipt,
} from 'lucide-react';
import type {
  ConsensusRequest, CritiqueEntry, DebateMsgEntry, DebatePhase,
  EchoAnalysis, ModelId, ModelProvider, PositionEntry,
  SessionPhase, SSEEvent,
} from '@/lib/types';
import { MODEL_LIST, MODELS, MODELS_BY_PROVIDER, PROVIDER_ORDER } from '@/lib/models';
import { ConsensusSummary } from './ConsensusSummary';
import { EchoConfirmation } from './EchoConfirmation';
import { PositionCards } from './PositionCards';
import { CritiqueGrid } from './CritiqueGrid';
import { DebateSection } from './DebateSection';
import { ProgressStepper } from './ui/ProgressStepper';

// ─── Constants ────────────────────────────────────────────────────────────────

const PHASE_ORDER: DebatePhase[] = ['echo', 'positions', 'critiques', 'debate', 'synthesis'];

// ─── Types ────────────────────────────────────────────────────────────────────

interface UsageTotals { inputTokens: number; outputTokens: number; costUsd: number }

// ─── Helpers (kept in this file per spec) ────────────────────────────────────

function fmt(usd: number) {
  if (usd === 0) return '$0.00';
  if (usd < 0.0001) return '<$0.0001';
  return `$${usd.toFixed(4)}`;
}
function fmtTok(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return `${n}`;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function renderMd(text: string): React.ReactNode {
  const boldParts = text.split(/\*\*([^*]+)\*\*/);
  if (boldParts.length === 1) {
    const italicParts = text.split(/\*([^*]+)\*/);
    if (italicParts.length === 1) return text;
    return (
      <>
        {italicParts.map((p, i) =>
          i % 2 === 1 ? <em key={i} className="italic">{p}</em> : p
        )}
      </>
    );
  }
  return (
    <>
      {boldParts.map((p, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold">{p}</strong>
        ) : (
          renderMd(p) as React.ReactElement
        )
      )}
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ModelDot({ modelId, size = 8 }: { modelId: ModelId; size?: number }) {
  return (
    <span
      className="rounded-full flex-shrink-0 inline-block"
      style={{ width: size, height: size, backgroundColor: MODELS[modelId].color }}
    />
  );
}

// ─── Cost tracker ─────────────────────────────────────────────────────────────

function CostTracker({ usage }: { usage: Partial<Record<ModelId, UsageTotals>> }) {
  const [open, setOpen] = useState(false);

  const totals = Object.values(usage).reduce(
    (acc, u) =>
      u
        ? { inputTokens: acc.inputTokens + u.inputTokens, outputTokens: acc.outputTokens + u.outputTokens, costUsd: acc.costUsd + u.costUsd }
        : acc,
    { inputTokens: 0, outputTokens: 0, costUsd: 0 }
  );

  return (
    <div className="fixed bottom-0 right-0 sm:bottom-4 sm:right-4 z-30 w-full sm:w-auto">
      <div className="rounded-none sm:rounded-2xl border-t sm:border border-gray-200 bg-white shadow-lg overflow-hidden sm:min-w-[210px]">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 transition-colors min-h-[44px]"
        >
          <Receipt size={13} className="text-gray-400 flex-shrink-0" />
          <span className="text-xs font-semibold text-gray-700 flex-1 text-left">Session cost</span>
          <span className={`text-xs font-bold tabular-nums ${totals.inputTokens > 0 ? 'text-violet-600' : 'text-gray-300'}`}>
            {fmt(totals.costUsd)}
          </span>
          {open ? <ChevronDown size={12} className="text-gray-400" /> : <ChevronUp size={12} className="text-gray-400" />}
        </button>

        {open && (
          <div className="border-t border-gray-100 px-4 py-3 space-y-1">
            <div className="grid grid-cols-4 gap-2 mb-2">
              {['Model', 'In', 'Out', 'Cost'].map((h) => (
                <span key={h} className={`text-xs text-gray-400 font-medium ${h !== 'Model' ? 'text-right' : ''}`}>{h}</span>
              ))}
            </div>
            {MODEL_LIST.map((model) => {
              const u = usage[model.id];
              return (
                <div key={model.id} className="grid grid-cols-4 gap-2 items-center">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: model.color }} />
                    <span className="text-xs text-gray-600 truncate">{model.name}</span>
                  </div>
                  <span className="text-xs tabular-nums text-gray-500 text-right">{u ? fmtTok(u.inputTokens) : '—'}</span>
                  <span className="text-xs tabular-nums text-gray-500 text-right">{u ? fmtTok(u.outputTokens) : '—'}</span>
                  <span className="text-xs tabular-nums text-gray-700 font-medium text-right">{u ? fmt(u.costUsd) : '—'}</span>
                </div>
              );
            })}
            <div className="grid grid-cols-4 gap-2 items-center pt-2 border-t border-gray-100 mt-2">
              <span className="text-xs font-bold text-gray-700">Total</span>
              <span className="text-xs tabular-nums text-gray-600 font-medium text-right">{fmtTok(totals.inputTokens)}</span>
              <span className="text-xs tabular-nums text-gray-600 font-medium text-right">{fmtTok(totals.outputTokens)}</span>
              <span className="text-xs tabular-nums text-violet-700 font-bold text-right">{fmt(totals.costUsd)}</span>
            </div>
            <p className="text-[10px] text-gray-300 pt-1">Prices estimated · since page load</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SSE stream reader ────────────────────────────────────────────────────────

async function readSSEStream(res: Response, onEvent: (e: SSEEvent) => void) {
  const reader  = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer    = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';
    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith('data: ')) continue;
      try { onEvent(JSON.parse(line.slice(6)) as SSEEvent); } catch { /* skip malformed */ }
    }
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ConsensusArena() {
  // Config state
  const [topic, setTopic]                   = useState('');
  const [selectedModels, setSelectedModels] = useState<ModelId[]>(['claude-haiku', 'gpt-nano', 'gemini-flash']);
  const [apiKeys, setApiKeys]               = useState<Partial<Record<ModelProvider, string>>>({});
  const [showApiKeys, setShowApiKeys]       = useState(false);

  // Cost — persists across all runs since page load
  const [sessionUsage, setSessionUsage] = useState<Partial<Record<ModelId, UsageTotals>>>({});

  // Session state
  const [phase, setPhase]                           = useState<SessionPhase>('config');
  const [currentDebatePhase, setCurrentDebatePhase] = useState<DebatePhase | null>(null);
  const [echoAnalysis, setEchoAnalysis]             = useState<EchoAnalysis | null>(null);
  const [positions, setPositions]                   = useState<PositionEntry[]>([]);
  const [critiques, setCritiques]                   = useState<CritiqueEntry[]>([]);
  const [disagreementDescription, setDisagreementDescription] = useState<string | null>(null);
  const [debateMessages, setDebateMessages]         = useState<DebateMsgEntry[]>([]);
  const [consensus, setConsensus]                   = useState<string | null>(null);
  const [error, setError]                           = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [positions.length, critiques.length, debateMessages.length, consensus]);

  // ─── Computed ──────────────────────────────────────────────────────────────

  const completedPhases = useMemo((): DebatePhase[] => {
    if (phase === 'complete') return [...PHASE_ORDER];
    if (!currentDebatePhase) return echoAnalysis ? ['echo'] : [];
    const idx = PHASE_ORDER.indexOf(currentDebatePhase);
    return idx > 0 ? PHASE_ORDER.slice(0, idx) : [];
  }, [phase, currentDebatePhase, echoAnalysis]);

  const isPositionPhase  = currentDebatePhase === 'positions';
  const isCritiquePhase  = currentDebatePhase === 'critiques';
  const isDebatePhase    = currentDebatePhase === 'debate';
  const isSynthesisPhase = currentDebatePhase === 'synthesis';
  const pendingPositions = selectedModels.filter((m) => !positions.find((p) => p.model === m));

  // ─── Helpers ───────────────────────────────────────────────────────────────

  function toggleModel(modelId: ModelId) {
    setSelectedModels((prev) =>
      prev.includes(modelId) ? prev.filter((m) => m !== modelId) : [...prev, modelId]
    );
  }

  // ─── Debate-phase SSE event handler ────────────────────────────────────────

  const handleEvent = useCallback((event: SSEEvent) => {
    switch (event.type) {
      case 'phase_change':
        setCurrentDebatePhase(event.phase);
        break;
      case 'position_complete':
        setPositions((prev) => [...prev, {
          model: event.model, modelName: event.modelName,
          summary: event.summary, fullText: event.fullText,
        }]);
        break;
      case 'critique_message':
        setCritiques((prev) => [...prev, {
          fromModel: event.fromModel, fromModelName: event.fromModelName,
          aboutModel: event.aboutModel, aboutModelName: event.aboutModelName,
          text: event.text, isDisagreement: event.isDisagreement,
        }]);
        break;
      case 'disagreement_detected':
        setDisagreementDescription(event.description);
        break;
      case 'debate_message':
        setDebateMessages((prev) => [...prev, {
          model: event.model, modelName: event.modelName,
          text: event.text, debateRound: event.debateRound,
        }]);
        break;
      case 'token_usage':
        setSessionUsage((prev) => {
          const ex = prev[event.model] ?? { inputTokens: 0, outputTokens: 0, costUsd: 0 };
          return {
            ...prev,
            [event.model]: {
              inputTokens: ex.inputTokens + event.inputTokens,
              outputTokens: ex.outputTokens + event.outputTokens,
              costUsd: ex.costUsd + event.costUsd,
            },
          };
        });
        break;
      case 'consensus_complete':
        setConsensus(event.consensus);
        break;
      case 'done':
        setPhase('complete');
        break;
      case 'error':
        setError(event.message);
        setPhase('config');
        break;
    }
  }, []);

  // ─── Flow 1: Echo analysis (first POST — no echoAnalysis in body) ───────────

  async function startEchoAnalysis(topicOverride?: string) {
    const t = (topicOverride ?? topic).trim();
    if (!t || selectedModels.length < 2) return;
    if (topicOverride) setTopic(topicOverride);

    setPhase('echo_analyzing');
    setCurrentDebatePhase('echo');
    setPositions([]); setCritiques([]); setDisagreementDescription(null);
    setDebateMessages([]); setConsensus(null); setError(null);
    setEchoAnalysis(null);

    try {
      const body: ConsensusRequest = { topic: t, models: selectedModels, apiKeys };
      const res = await fetch('/api/consensus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      await readSSEStream(res, (event) => {
        switch (event.type) {
          case 'echo_analysis':
            setEchoAnalysis(event.analysis);
            setPhase('echo_confirm');
            break;
          case 'token_usage':
            setSessionUsage((prev) => {
              const ex = prev[event.model] ?? { inputTokens: 0, outputTokens: 0, costUsd: 0 };
              return {
                ...prev,
                [event.model]: {
                  inputTokens: ex.inputTokens + event.inputTokens,
                  outputTokens: ex.outputTokens + event.outputTokens,
                  costUsd: ex.costUsd + event.costUsd,
                },
              };
            });
            break;
          case 'error':
            setError(event.message);
            setPhase('config');
            break;
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setPhase('config');
    }
  }

  // ─── Flow 2: Full debate (second POST — echoAnalysis confirmed by user) ─────

  async function startDebate(confirmedAnalysis: EchoAnalysis) {
    setEchoAnalysis(confirmedAnalysis);
    setPhase('running');
    setCurrentDebatePhase(null);
    setPositions([]); setCritiques([]); setDisagreementDescription(null);
    setDebateMessages([]); setConsensus(null); setError(null);

    try {
      const body: ConsensusRequest = {
        topic: topic.trim(),
        models: selectedModels,
        apiKeys,
        echoAnalysis: confirmedAnalysis,
      };
      const res = await fetch('/api/consensus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      await readSSEStream(res, handleEvent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setPhase('config');
    }
  }

  function handleReanalyze(editedTopic: string) {
    startEchoAnalysis(editedTopic);
  }

  function reset() {
    setPhase('config');
    setCurrentDebatePhase(null);
    setEchoAnalysis(null);
    setPositions([]); setCritiques([]); setDisagreementDescription(null);
    setDebateMessages([]); setConsensus(null); setError(null);
  }

  // ─── Shared top bar ────────────────────────────────────────────────────────

  function TopBar({ showStatus }: { showStatus?: boolean }) {
    return (
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-gray-200 px-4 sm:px-5 py-3 flex items-center gap-4 flex-wrap">
        <span className="text-xs font-bold tracking-widest text-gray-300">ECHONSENSUS</span>
        <div className="h-4 w-px bg-gray-200 flex-shrink-0" />
        <p className="text-sm text-gray-600 flex-1 truncate max-w-[200px] sm:max-w-none">{topic}</p>
        <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
          {showStatus && phase === 'running' && (
            <span className="flex items-center gap-1.5 text-xs text-violet-500">
              <Loader2 size={12} className="animate-spin" />
              {isSynthesisPhase ? 'Synthesizing…' : isDebatePhase ? 'Debating…' : isCritiquePhase ? 'Critiquing…' : 'Thinking…'}
            </span>
          )}
          {showStatus && phase === 'complete' && (
            <span className="flex items-center gap-1.5 text-xs text-green-600">
              <CheckCircle2 size={12} /> Complete
            </span>
          )}
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-800 hover:border-gray-400 transition-all min-h-[44px]"
          >
            <RotateCcw size={12} /> New
          </button>
        </div>
      </div>
    );
  }

  // ─── Render: Config ────────────────────────────────────────────────────────

  if (phase === 'config') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-16">
        <CostTracker usage={sessionUsage} />

        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">
            ECHO<span style={{ color: '#7C3AED' }}>N</span>SENSUS
          </h1>
          <p className="text-sm text-gray-400">
            Multiple AI minds debate until they reach one collective answer.
          </p>
        </div>

        <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white shadow-sm px-4 sm:px-7 py-7 space-y-6">
          {/* Topic */}
          <div>
            <label className="block text-xs font-bold tracking-widest text-gray-400 uppercase mb-2">
              Topic or Question
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What should humanity prioritize: climate change or AI safety?"
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-violet-400 resize-none transition-colors"
            />
          </div>

          {/* Model selection — grouped by provider */}
          <div>
            <label className="block text-xs font-bold tracking-widest text-gray-400 uppercase mb-3">
              Participants
              {selectedModels.length < 2 && (
                <span className="font-normal normal-case text-red-400 ml-2">— pick at least 2</span>
              )}
            </label>
            <div className="space-y-3">
              {PROVIDER_ORDER.map((providerKey) => {
                const group = MODELS_BY_PROVIDER[providerKey];
                return (
                  <div key={providerKey}>
                    <p className="text-[10px] font-bold tracking-widest text-gray-300 uppercase mb-1.5">
                      {group[0].provider}
                    </p>
                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                      {group.map((model) => {
                        const active = selectedModels.includes(model.id);
                        return (
                          <button
                            key={model.id}
                            onClick={() => toggleModel(model.id)}
                            className="px-3 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 min-h-[48px] justify-center sm:justify-start"
                            style={
                              active
                                ? { backgroundColor: model.color + '12', borderColor: model.color + '55', color: model.color }
                                : { borderColor: '#e5e7eb', color: '#9ca3af', backgroundColor: 'white' }
                            }
                          >
                            {model.name}
                            <span className="opacity-50">${model.inputCostPerM}/M</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Models debate until consensus — up to 5 rounds. Prices are per million input tokens.
            </p>
          </div>

          {/* API Keys */}
          <div>
            <button
              onClick={() => setShowApiKeys((v) => !v)}
              className="flex items-center gap-2 text-xs font-bold tracking-widest text-gray-400 uppercase hover:text-gray-600 transition-colors"
            >
              {showApiKeys ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              API Keys
              <span className="font-normal normal-case text-gray-300 ml-1">(optional if set in env)</span>
            </button>
            {showApiKeys && (
              <div className="mt-3 space-y-2">
                {PROVIDER_ORDER.map((providerKey) => {
                  const rep = MODELS_BY_PROVIDER[providerKey][0];
                  return (
                    <div key={providerKey} className="flex items-center gap-3">
                      <span className="text-xs font-medium w-20 shrink-0" style={{ color: rep.color }}>
                        {rep.provider}
                      </span>
                      <input
                        type="password"
                        value={apiKeys[providerKey] ?? ''}
                        onChange={(e) => setApiKeys((prev) => ({ ...prev, [providerKey]: e.target.value }))}
                        placeholder={rep.envKey}
                        className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-600 placeholder-gray-300 focus:outline-none font-mono min-h-[44px]"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-xs text-red-500">{error}</p>
            </div>
          )}

          <button
            onClick={() => startEchoAnalysis()}
            disabled={!topic.trim() || selectedModels.length < 2}
            className="w-full rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed text-white min-h-[48px]"
            style={{ backgroundColor: '#7C3AED' }}
          >
            <Play size={14} />
            Start Debate
          </button>
        </div>
      </div>
    );
  }

  // ─── Render: Echo analyzing ────────────────────────────────────────────────

  if (phase === 'echo_analyzing') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <CostTracker usage={sessionUsage} />
        <div className="w-full max-w-md text-center space-y-6 pb-16">
          <ProgressStepper currentPhase="echo" completedPhases={[]} />
          <Loader2 size={24} className="animate-spin text-violet-500 mx-auto" />
          <p className="text-sm text-gray-500">Analyzing your prompt…</p>
        </div>
      </div>
    );
  }

  // ─── Render: Echo confirm ──────────────────────────────────────────────────

  if (phase === 'echo_confirm' && echoAnalysis) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <CostTracker usage={sessionUsage} />
        <TopBar />
        <div className="flex-1 overflow-y-auto pb-20">
          <EchoConfirmation
            analysis={echoAnalysis}
            onConfirm={startDebate}
            onReanalyze={handleReanalyze}
          />
        </div>
      </div>
    );
  }

  // ─── Render: Running / Complete ────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <CostTracker usage={sessionUsage} />
      <TopBar showStatus />

      <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 pb-24 space-y-4">
        <ProgressStepper
          currentPhase={currentDebatePhase}
          completedPhases={completedPhases}
        />

        {/* Initial Positions */}
        {(positions.length > 0 || isPositionPhase) && (
          <PositionCards
            positions={positions}
            pendingPositions={pendingPositions}
            isLoading={isPositionPhase}
          />
        )}

        {/* Cross-Critique */}
        {(critiques.length > 0 || isCritiquePhase) && (
          <CritiqueGrid
            critiques={critiques}
            selectedModels={selectedModels}
            loading={isCritiquePhase}
          />
        )}

        {/* Disagreement alert */}
        {disagreementDescription && (
          <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 px-5 py-4">
            <AlertTriangle size={16} className="text-orange-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-1">
                Disagreement Detected
              </p>
              <p className="text-sm text-orange-800">{disagreementDescription}</p>
            </div>
          </div>
        )}

        {/* Debate */}
        {(debateMessages.length > 0 || isDebatePhase) && (
          <DebateSection
            debateMessages={debateMessages}
            selectedModels={selectedModels}
            loading={isDebatePhase}
          />
        )}

        {/* Synthesis loading */}
        {isSynthesisPhase && !consensus && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 animate-pulse space-y-3">
            <div className="h-3 bg-amber-100 rounded w-40" />
            <div className="h-3 bg-amber-100 rounded w-full" />
            <div className="h-3 bg-amber-100 rounded w-5/6" />
          </div>
        )}

        {/* Consensus */}
        {consensus && <ConsensusSummary consensus={consensus} />}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
