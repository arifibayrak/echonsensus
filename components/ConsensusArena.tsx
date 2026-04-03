'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Play, RotateCcw, Loader2, AlertCircle, AlertTriangle, CheckCircle2, Receipt } from 'lucide-react';
import type { ConsensusRequest, DebatePhase, ModelId, SessionPhase, SSEEvent } from '@/lib/types';
import { MODEL_LIST, MODELS } from '@/lib/models';
import { ConsensusSummary } from './ConsensusSummary';

// ─── Sub-types ────────────────────────────────────────────────────────────────

interface UsageTotals {
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

interface PositionEntry {
  model: ModelId;
  modelName: string;
  summary: string;
  fullText: string;
}

interface CritiqueEntry {
  fromModel: ModelId;
  fromModelName: string;
  aboutModel: ModelId;
  aboutModelName: string;
  text: string;
  isDisagreement: boolean;
}

interface DebateMsgEntry {
  model: ModelId;
  modelName: string;
  text: string;
  debateRound: number;
}

// ─── Small display helpers ────────────────────────────────────────────────────

function PhaseHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-xs font-bold tracking-widest text-gray-400 uppercase px-2">{label}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

function ModelDot({ modelId, size = 8 }: { modelId: ModelId; size?: number }) {
  return (
    <span
      className="rounded-full flex-shrink-0 inline-block"
      style={{ width: size, height: size, backgroundColor: MODELS[modelId].color }}
    />
  );
}

function PositionCard({
  entry,
  pending,
}: {
  entry: PositionEntry | null;
  pending?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  if (pending || !entry) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 animate-pulse space-y-2">
        <div className="h-3 bg-gray-100 rounded w-24" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-5/6" />
      </div>
    );
  }

  const model = MODELS[entry.model];
  return (
    <div
      className="rounded-xl border bg-white p-4 transition-all"
      style={{ borderColor: model.color + '45', borderLeftWidth: 3, borderLeftColor: model.color }}
    >
      <div className="flex items-center gap-2 mb-2">
        <ModelDot modelId={entry.model} />
        <span className="text-sm font-bold" style={{ color: model.color }}>{model.name}</span>
        <span className="text-xs text-gray-400">{model.provider}</span>
      </div>
      <p className="text-sm text-gray-800 leading-relaxed">{entry.summary}</p>
      {entry.fullText && (
        <>
          {expanded && (
            <p className="text-sm text-gray-600 leading-relaxed mt-3 pt-3 border-t border-gray-100 whitespace-pre-line">
              {entry.fullText}
            </p>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? 'Hide full answer' : 'Show full answer'}
          </button>
        </>
      )}
    </div>
  );
}

function CritiqueGrid({
  critiques,
  selectedModels,
  loading,
}: {
  critiques: CritiqueEntry[];
  selectedModels: ModelId[];
  loading: boolean;
}) {
  const n = selectedModels.length;

  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
    >
      {selectedModels.map((fromModel) => {
        const fromCfg = MODELS[fromModel];
        const targets = selectedModels.filter((m) => m !== fromModel);

        return (
          <div key={fromModel} className="flex flex-col gap-2">
            {/* Column header */}
            <div
              className="flex items-center gap-1.5 pb-2 border-b"
              style={{ borderColor: fromCfg.color + '40' }}
            >
              <ModelDot modelId={fromModel} />
              <span className="text-xs font-bold truncate" style={{ color: fromCfg.color }}>
                {fromCfg.name}
              </span>
            </div>

            {/* One card per target model */}
            {targets.map((aboutModel) => {
              const aboutCfg = MODELS[aboutModel];
              const critique = critiques.find(
                (c) => c.fromModel === fromModel && c.aboutModel === aboutModel
              );

              if (!critique) {
                return (
                  <div
                    key={aboutModel}
                    className={`rounded-lg border border-gray-100 bg-white p-3 ${loading ? 'animate-pulse' : ''}`}
                  >
                    <div className="flex items-center gap-1 mb-2">
                      <ModelDot modelId={aboutModel} size={6} />
                      <span className="text-xs text-gray-400">{aboutCfg.name}</span>
                    </div>
                    {loading && (
                      <>
                        <div className="h-2 bg-gray-100 rounded w-full mb-1" />
                        <div className="h-2 bg-gray-100 rounded w-4/5" />
                      </>
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={aboutModel}
                  className="rounded-lg border bg-white p-3"
                  style={{ borderColor: '#e5e7eb' }}
                >
                  <div className="flex items-center gap-1 mb-1.5">
                    <ModelDot modelId={aboutModel} size={6} />
                    <span className="text-xs font-semibold" style={{ color: aboutCfg.color }}>
                      {aboutCfg.name}
                    </span>
                    <span
                      className={`ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                        critique.isDisagreement
                          ? 'bg-red-100 text-red-600'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {critique.isDisagreement ? '✗' : '✓'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">{critique.text}</p>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function DebateBubble({ entry }: { entry: DebateMsgEntry }) {
  const model = MODELS[entry.model];
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 mt-0.5">
        <ModelDot modelId={entry.model} size={10} />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-xs font-bold mr-2" style={{ color: model.color }}>{model.name}</span>
        <span className="text-sm text-gray-800 leading-relaxed">{entry.text}</span>
      </div>
    </div>
  );
}

function DebateSection({
  debateMessages,
  selectedModels,
  loading,
}: {
  debateMessages: DebateMsgEntry[];
  selectedModels: ModelId[];
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);

  const rounds = [...new Set(debateMessages.map((m) => m.debateRound))].sort((a, b) => a - b);
  const totalRounds = rounds.length;
  const totalMessages = debateMessages.length;

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Collapsed header — always visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex -space-x-1 flex-shrink-0">
          {selectedModels.map((m) => (
            <span
              key={m}
              className="w-3 h-3 rounded-full ring-2 ring-white inline-block"
              style={{ backgroundColor: MODELS[m].color }}
            />
          ))}
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-gray-800">
            {loading && totalMessages === 0
              ? 'Debate starting…'
              : `${totalRounds} round${totalRounds !== 1 ? 's' : ''} · ${totalMessages} message${totalMessages !== 1 ? 's' : ''}`}
          </span>
          {loading && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs text-violet-500">
              <Loader2 size={11} className="animate-spin" />
              live
            </span>
          )}
        </div>

        <span className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {open ? 'hide' : 'show'}
        </span>
      </button>

      {/* Expanded chat */}
      {open && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-5">
          {rounds.map((round) => {
            const msgs = debateMessages.filter((m) => m.debateRound === round);
            return (
              <div key={round}>
                <p className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-3">
                  Round {round}
                </p>
                <div className="space-y-3">
                  {msgs.map((msg, i) => (
                    <DebateBubble key={i} entry={msg} />
                  ))}
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex gap-3 animate-pulse">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-200 mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 bg-gray-100 rounded w-full" />
                <div className="h-2.5 bg-gray-100 rounded w-3/4" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function fmt(usd: number): string {
  if (usd === 0) return '$0.00';
  if (usd < 0.0001) return '<$0.0001';
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(4)}`;
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${n}`;
}

function CostTracker({ usage }: { usage: Partial<Record<ModelId, UsageTotals>> }) {
  const [open, setOpen] = useState(false);

  const totals = Object.values(usage).reduce(
    (acc, u) => {
      if (!u) return acc;
      return { inputTokens: acc.inputTokens + u.inputTokens, outputTokens: acc.outputTokens + u.outputTokens, costUsd: acc.costUsd + u.costUsd };
    },
    { inputTokens: 0, outputTokens: 0, costUsd: 0 }
  );

  const hasData = totals.inputTokens > 0;

  return (
    <div className="fixed bottom-4 right-4 z-30">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden min-w-[200px]">
        {/* Toggle bar */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 transition-colors"
        >
          <Receipt size={13} className="text-gray-400 flex-shrink-0" />
          <span className="text-xs font-semibold text-gray-700 flex-1 text-left">
            Session cost
          </span>
          <span className={`text-xs font-bold tabular-nums ${hasData ? 'text-violet-600' : 'text-gray-300'}`}>
            {fmt(totals.costUsd)}
          </span>
          {open ? <ChevronDown size={12} className="text-gray-400" /> : <ChevronUp size={12} className="text-gray-400" />}
        </button>

        {/* Breakdown table */}
        {open && (
          <div className="border-t border-gray-100 px-4 py-3 space-y-1">
            {/* Header row */}
            <div className="grid grid-cols-4 gap-2 mb-2">
              <span className="text-xs text-gray-400 font-medium">Model</span>
              <span className="text-xs text-gray-400 font-medium text-right">In</span>
              <span className="text-xs text-gray-400 font-medium text-right">Out</span>
              <span className="text-xs text-gray-400 font-medium text-right">Cost</span>
            </div>

            {MODEL_LIST.map((model) => {
              const u = usage[model.id];
              return (
                <div key={model.id} className="grid grid-cols-4 gap-2 items-center">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: model.color }} />
                    <span className="text-xs text-gray-600 truncate">{model.name}</span>
                  </div>
                  <span className="text-xs tabular-nums text-gray-500 text-right">{u ? fmtTokens(u.inputTokens) : '—'}</span>
                  <span className="text-xs tabular-nums text-gray-500 text-right">{u ? fmtTokens(u.outputTokens) : '—'}</span>
                  <span className="text-xs tabular-nums text-gray-700 font-medium text-right">{u ? fmt(u.costUsd) : '—'}</span>
                </div>
              );
            })}

            {/* Total row */}
            <div className="grid grid-cols-4 gap-2 items-center pt-2 border-t border-gray-100 mt-2">
              <span className="text-xs font-bold text-gray-700">Total</span>
              <span className="text-xs tabular-nums text-gray-600 font-medium text-right">{fmtTokens(totals.inputTokens)}</span>
              <span className="text-xs tabular-nums text-gray-600 font-medium text-right">{fmtTokens(totals.outputTokens)}</span>
              <span className="text-xs tabular-nums text-violet-700 font-bold text-right">{fmt(totals.costUsd)}</span>
            </div>

            <p className="text-[10px] text-gray-300 pt-1">
              Prices estimated · since page load
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ConsensusArena() {
  // Config
  const [topic, setTopic] = useState('');
  const [selectedModels, setSelectedModels] = useState<ModelId[]>(['claude', 'gpt4', 'gemini']);
  const [apiKeys, setApiKeys] = useState<Partial<Record<ModelId, string>>>({});
  const [showApiKeys, setShowApiKeys] = useState(false);

  // Cost tracking — persists across all runs since page load
  const [sessionUsage, setSessionUsage] = useState<Partial<Record<ModelId, UsageTotals>>>({});

  // Session
  const [phase, setPhase] = useState<SessionPhase>('config');
  const [currentDebatePhase, setCurrentDebatePhase] = useState<DebatePhase | null>(null);
  const [positions, setPositions] = useState<PositionEntry[]>([]);
  const [critiques, setCritiques] = useState<CritiqueEntry[]>([]);
  const [disagreementDescription, setDisagreementDescription] = useState<string | null>(null);
  const [debateMessages, setDebateMessages] = useState<DebateMsgEntry[]>([]);
  const [consensus, setConsensus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll as new content arrives
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [positions.length, critiques.length, debateMessages.length, consensus]);

  function toggleModel(modelId: ModelId) {
    setSelectedModels((prev) =>
      prev.includes(modelId) ? prev.filter((m) => m !== modelId) : [...prev, modelId]
    );
  }

  const handleEvent = useCallback((event: SSEEvent) => {
    switch (event.type) {
      case 'phase_change':
        setCurrentDebatePhase(event.phase);
        break;
      case 'position_complete':
        setPositions((prev) => [
          ...prev,
          { model: event.model, modelName: event.modelName, summary: event.summary, fullText: event.fullText },
        ]);
        break;
      case 'critique_message':
        setCritiques((prev) => [
          ...prev,
          {
            fromModel: event.fromModel,
            fromModelName: event.fromModelName,
            aboutModel: event.aboutModel,
            aboutModelName: event.aboutModelName,
            text: event.text,
            isDisagreement: event.isDisagreement,
          },
        ]);
        break;
      case 'disagreement_detected':
        setDisagreementDescription(event.description);
        break;
      case 'debate_message':
        setDebateMessages((prev) => [
          ...prev,
          { model: event.model, modelName: event.modelName, text: event.text, debateRound: event.debateRound },
        ]);
        break;
      case 'token_usage':
        setSessionUsage((prev) => {
          const existing = prev[event.model] ?? { inputTokens: 0, outputTokens: 0, costUsd: 0 };
          return {
            ...prev,
            [event.model]: {
              inputTokens: existing.inputTokens + event.inputTokens,
              outputTokens: existing.outputTokens + event.outputTokens,
              costUsd: existing.costUsd + event.costUsd,
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

  async function startConsensus() {
    if (!topic.trim() || selectedModels.length < 2) return;

    setPhase('running');
    setCurrentDebatePhase(null);
    setPositions([]);
    setCritiques([]);
    setDisagreementDescription(null);
    setDebateMessages([]);
    setConsensus(null);
    setError(null);

    try {
      const body: ConsensusRequest = { topic: topic.trim(), models: selectedModels, apiKeys };
      const res = await fetch('/api/consensus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data: ')) continue;
          try { handleEvent(JSON.parse(line.slice(6)) as SSEEvent); } catch { /* skip */ }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setPhase('config');
    }
  }

  function reset() {
    setPhase('config');
    setCurrentDebatePhase(null);
    setPositions([]);
    setCritiques([]);
    setDisagreementDescription(null);
    setDebateMessages([]);
    setConsensus(null);
    setError(null);
  }

  // ─── Config ────────────────────────────────────────────────────────────────

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

        <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white shadow-sm p-7 space-y-6">
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

          <div>
            <label className="block text-xs font-bold tracking-widest text-gray-400 uppercase mb-2">
              Participants
              {selectedModels.length < 2 && (
                <span className="font-normal normal-case text-red-400 ml-2">— pick at least 2</span>
              )}
            </label>
            <div className="flex flex-wrap gap-2">
              {MODEL_LIST.map((model) => {
                const active = selectedModels.includes(model.id);
                return (
                  <button
                    key={model.id}
                    onClick={() => toggleModel(model.id)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-all"
                    style={
                      active
                        ? { backgroundColor: model.color + '12', borderColor: model.color + '55', color: model.color }
                        : { borderColor: '#e5e7eb', color: '#9ca3af', backgroundColor: 'white' }
                    }
                  >
                    {model.name}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Models debate automatically — up to 5 rounds until consensus.
            </p>
          </div>

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
                {MODEL_LIST.map((model) => (
                  <div key={model.id} className="flex items-center gap-3">
                    <span className="text-xs font-medium w-16 shrink-0" style={{ color: model.color }}>
                      {model.name}
                    </span>
                    <input
                      type="password"
                      value={apiKeys[model.id] ?? ''}
                      onChange={(e) => setApiKeys((prev) => ({ ...prev, [model.id]: e.target.value }))}
                      placeholder={model.envKey}
                      className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-600 placeholder-gray-300 focus:outline-none font-mono"
                    />
                  </div>
                ))}
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
            onClick={startConsensus}
            disabled={!topic.trim() || selectedModels.length < 2}
            className="w-full rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed text-white"
            style={{ backgroundColor: '#7C3AED' }}
          >
            <Play size={14} />
            Start Debate
          </button>
        </div>
      </div>
    );
  }

  // ─── Running / Complete ────────────────────────────────────────────────────

  const pendingPositions = selectedModels.filter(
    (m) => !positions.find((p) => p.model === m)
  );
  const isPositionPhase = currentDebatePhase === 'positions';
  const isCritiquePhase = currentDebatePhase === 'critiques';
  const isDebatePhase = currentDebatePhase === 'debate';
  const isSynthesisPhase = currentDebatePhase === 'synthesis';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <CostTracker usage={sessionUsage} />
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-gray-200 px-5 py-3 flex items-center gap-4">
        <span className="text-xs font-bold tracking-widest text-gray-300">ECHONSENSUS</span>
        <div className="h-4 w-px bg-gray-200" />
        <p className="text-sm text-gray-600 flex-1 truncate">{topic}</p>
        <div className="flex items-center gap-3 flex-shrink-0">
          {phase === 'running' && (
            <span className="flex items-center gap-1.5 text-xs text-violet-500">
              <Loader2 size={12} className="animate-spin" />
              {isSynthesisPhase ? 'Synthesizing…'
                : isDebatePhase ? 'Debating…'
                : isCritiquePhase ? 'Critiquing…'
                : 'Thinking…'}
            </span>
          )}
          {phase === 'complete' && (
            <span className="flex items-center gap-1.5 text-xs text-green-600">
              <CheckCircle2 size={12} />
              Complete
            </span>
          )}
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-800 hover:border-gray-400 transition-all"
          >
            <RotateCcw size={12} />
            New
          </button>
        </div>
      </div>

      {/* Chat feed */}
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 pb-16">

        {/* ── Initial Positions ──────────────────────────────────────── */}
        {(positions.length > 0 || isPositionPhase) && (
          <>
            <PhaseHeader label="Initial Positions" />
            <div className="space-y-3">
              {positions.map((entry) => (
                <PositionCard key={entry.model} entry={entry} />
              ))}
              {isPositionPhase &&
                pendingPositions.map((modelId) => (
                  <PositionCard key={modelId} entry={null} pending />
                ))}
            </div>
          </>
        )}

        {/* ── Cross-Critique ─────────────────────────────────────────── */}
        {(critiques.length > 0 || isCritiquePhase) && (
          <>
            <PhaseHeader label="Cross-Critique" />
            <CritiqueGrid
              critiques={critiques}
              selectedModels={selectedModels}
              loading={isCritiquePhase}
            />
          </>
        )}

        {/* ── Disagreement Alert ─────────────────────────────────────── */}
        {disagreementDescription && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 px-5 py-4">
            <AlertTriangle size={16} className="text-orange-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-1">
                Disagreement Detected
              </p>
              <p className="text-sm text-orange-800">{disagreementDescription}</p>
            </div>
          </div>
        )}

        {/* ── Debate ────────────────────────────────────────────────── */}
        {(debateMessages.length > 0 || isDebatePhase) && (
          <>
            <PhaseHeader label="Debate" />
            <DebateSection
              debateMessages={debateMessages}
              selectedModels={selectedModels}
              loading={isDebatePhase}
            />
          </>
        )}

        {/* ── Synthesis loading ──────────────────────────────────────── */}
        {isSynthesisPhase && !consensus && (
          <>
            <PhaseHeader label="Consensus" />
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 animate-pulse space-y-3">
              <div className="h-3 bg-amber-100 rounded w-40" />
              <div className="h-3 bg-amber-100 rounded w-full" />
              <div className="h-3 bg-amber-100 rounded w-5/6" />
            </div>
          </>
        )}

        {/* ── Consensus ─────────────────────────────────────────────── */}
        {consensus && (
          <>
            <PhaseHeader label="Consensus" />
            <ConsensusSummary consensus={consensus} />
          </>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
