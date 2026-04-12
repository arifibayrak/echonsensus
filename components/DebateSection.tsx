'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Loader2, Maximize2, X } from 'lucide-react';
import type { DebateMsgEntry, ModelId } from '@/lib/types';
import { MODELS } from '@/lib/models';

// ─── Local helpers ────────────────────────────────────────────────────────────

function ModelDot({ modelId, size = 8 }: { modelId: ModelId; size?: number }) {
  return (
    <span
      className="rounded-full flex-shrink-0 inline-block"
      style={{ width: size, height: size, backgroundColor: MODELS[modelId].color }}
    />
  );
}

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

// ─── Debate bubble ────────────────────────────────────────────────────────────

function DebateBubble({ entry }: { entry: DebateMsgEntry }) {
  const model = MODELS[entry.model];
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 mt-0.5">
        <ModelDot modelId={entry.model} size={10} />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-xs font-bold mr-2" style={{ color: model.color }}>
          {model.name}
        </span>
        <span className="text-sm text-gray-800 leading-relaxed">{renderMd(entry.text)}</span>
      </div>
    </div>
  );
}

// ─── Exported component ───────────────────────────────────────────────────────

interface Props {
  debateMessages: DebateMsgEntry[];
  selectedModels: ModelId[];
  loading: boolean;
}

export function DebateSection({ debateMessages, selectedModels, loading }: Props) {
  const [open, setOpen]   = useState(false);
  const [modal, setModal] = useState(false);

  const rounds      = [...new Set(debateMessages.map((m) => m.debateRound))].sort((a, b) => a - b);
  const totalRounds = rounds.length;
  const totalMsgs   = debateMessages.length;

  const chatContent = (
    <div className="space-y-5">
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
  );

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center gap-3 px-5 py-3">
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
              {loading && totalMsgs === 0
                ? 'Debate starting…'
                : `${totalRounds} round${totalRounds !== 1 ? 's' : ''} · ${totalMsgs} message${totalMsgs !== 1 ? 's' : ''}`}
            </span>
            {loading && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-violet-500">
                <Loader2 size={11} className="animate-spin" /> live
              </span>
            )}
          </div>

          {/* Expand to modal */}
          <button
            onClick={() => { setModal(true); setOpen(true); }}
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-800 hover:border-gray-400 transition-all flex-shrink-0 min-h-[44px]"
            title="Open full view"
          >
            <Maximize2 size={11} />
            <span className="hidden sm:inline">Expand</span>
          </button>

          {/* Inline toggle */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 min-h-[44px]"
          >
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span className="hidden sm:inline">{open ? 'hide' : 'show'}</span>
          </button>
        </div>

        {/* Inline expanded content */}
        {open && !modal && (
          <div className="border-t border-gray-100 px-5 py-4">
            {chatContent}
          </div>
        )}
      </div>

      {/* Modal overlay */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setModal(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex -space-x-1">
                {selectedModels.map((m) => (
                  <span
                    key={m}
                    className="w-3 h-3 rounded-full ring-2 ring-white inline-block"
                    style={{ backgroundColor: MODELS[m].color }}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-gray-800 flex-1">
                Debate · {totalRounds} round{totalRounds !== 1 ? 's' : ''} · {totalMsgs} messages
              </span>
              <button
                onClick={() => setModal(false)}
                className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>
            {/* Modal chat */}
            <div className="overflow-y-auto px-6 py-5 flex-1">
              {chatContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
