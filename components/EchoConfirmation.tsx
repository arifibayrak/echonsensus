'use client';

import { useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import type { EchoAnalysis } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type AddType = 'fact' | 'debate' | 'constraint';

// ─── Transform raw input into a structured statement ─────────────────────────

function generateStatement(raw: string, type: AddType): string {
  const t = raw.trim();
  if (!t) return '';
  if (type === 'fact') return t;
  if (type === 'debate') return `Is ${t} a viable approach?`;
  return `Prefer ${t} when possible`;
}

// ─── Toggle button config ─────────────────────────────────────────────────────

const TYPE_CONFIG: Record<AddType, { label: string; activeClass: string }> = {
  fact:       { label: 'Fact',         activeClass: 'bg-green-500 text-white border-green-500' },
  debate:     { label: 'Debate Point', activeClass: 'bg-orange-500 text-white border-orange-500' },
  constraint: { label: 'Constraint',   activeClass: 'bg-blue-500 text-white border-blue-500' },
};

// ─── Add Factor Section ───────────────────────────────────────────────────────

interface AddFactorProps {
  onAdd: (statement: string, type: AddType) => void;
}

function AddFactorSection({ onAdd }: AddFactorProps) {
  const [rawInput, setRawInput]         = useState('');
  const [addType, setAddType]           = useState<AddType>('debate');
  const [editedStatement, setEditedStatement] = useState('');
  const [showPreview, setShowPreview]   = useState(false);

  function handleGenerate() {
    const stmt = generateStatement(rawInput, addType);
    if (!stmt) return;
    setEditedStatement(stmt);
    setShowPreview(true);
  }

  function handleConfirmAdd() {
    const stmt = editedStatement.trim();
    if (!stmt) return;
    onAdd(stmt, addType);
    setRawInput('');
    setEditedStatement('');
    setShowPreview(false);
  }

  function handleCancel() {
    setEditedStatement('');
    setShowPreview(false);
  }

  const typeColor =
    addType === 'fact' ? 'border-green-200 bg-green-50'
    : addType === 'debate' ? 'border-orange-200 bg-orange-50'
    : 'border-blue-200 bg-blue-50';

  return (
    <div className={`rounded-xl border p-4 space-y-3 transition-colors ${typeColor}`}>
      <p className="text-[11px] font-bold tracking-widest text-gray-500 uppercase">
        Add a Factor
      </p>

      {/* Type toggle */}
      <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs bg-white">
        {(Object.entries(TYPE_CONFIG) as [AddType, typeof TYPE_CONFIG[AddType]][]).map(([type, cfg]) => (
          <button
            key={type}
            onClick={() => { setAddType(type); setShowPreview(false); setEditedStatement(''); }}
            className={`flex-1 py-2 font-medium transition-colors border-r last:border-r-0 border-gray-200 min-h-[36px] ${
              addType === type ? cfg.activeClass : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      {/* Raw input + Generate */}
      <div className="flex gap-2">
        <input
          value={rawInput}
          onChange={(e) => { setRawInput(e.target.value); setShowPreview(false); }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(); }}
          placeholder={
            addType === 'fact'       ? 'e.g. Electric cars are more expensive upfront'
            : addType === 'debate'   ? 'e.g. night-travelling'
            : 'e.g. must be budget-friendly'
          }
          className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-violet-400 min-h-[44px]"
        />
        <button
          onClick={handleGenerate}
          disabled={!rawInput.trim()}
          className="rounded-lg border border-gray-300 bg-white px-3 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Generate →
        </button>
      </div>

      {/* Inline editable preview */}
      {showPreview && (
        <div className="space-y-2 pt-1">
          <p className="text-[11px] text-gray-500">
            Edit if needed, then confirm:
          </p>
          <textarea
            value={editedStatement}
            onChange={(e) => setEditedStatement(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-violet-400 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleConfirmAdd}
              disabled={!editedStatement.trim()}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold text-white transition-opacity min-h-[40px] disabled:opacity-40 ${
                addType === 'fact'       ? 'bg-green-500'
                : addType === 'debate'   ? 'bg-orange-500'
                : 'bg-blue-500'
              }`}
            >
              ✓ Add to {TYPE_CONFIG[addType].label}s
            </button>
            <button
              onClick={handleCancel}
              className="rounded-lg border border-gray-200 px-4 py-2 text-xs text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-all min-h-[40px]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  analysis: EchoAnalysis;
  onConfirm: (edited: EchoAnalysis) => void;
  onReanalyze: (editedTopic: string) => void;
}

export function EchoConfirmation({ analysis, onConfirm, onReanalyze }: Props) {
  const [facts, setFacts]                 = useState(analysis.facts);
  const [debatableTopics, setDebatableTopics] = useState(analysis.debatableTopics);
  const [attributes, setAttributes]       = useState(analysis.attributes);
  const [refinedPrompt, setRefinedPrompt] = useState(analysis.refinedPrompt);

  const hasQuestions = (analysis.followUpQuestions?.length ?? 0) > 0;

  function handleAdd(statement: string, type: AddType) {
    if (type === 'fact')       setFacts((p) => [...p, statement]);
    if (type === 'debate')     setDebatableTopics((p) => [...p, statement]);
    if (type === 'constraint') setAttributes((p) => [...p, statement]);
  }

  function handleConfirm() {
    onConfirm({ ...analysis, facts, debatableTopics, attributes, refinedPrompt });
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 space-y-4">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">Echo Analysis</h2>
        <p className="text-sm text-gray-400 mt-1">
          Review and refine the analysis before starting the debate
        </p>
      </div>

      {/* Established Facts */}
      {facts.length > 0 && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-[11px] font-bold tracking-widest text-green-700 uppercase mb-3">
            Established Facts
          </p>
          <ul className="space-y-2">
            {facts.map((fact, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="flex-1 text-sm text-green-900 leading-snug">{fact}</span>
                <button
                  onClick={() => setFacts((p) => p.filter((_, j) => j !== i))}
                  className="text-green-400 hover:text-green-600 transition-colors flex items-center justify-center min-h-[28px] min-w-[28px]"
                  aria-label="Remove fact"
                >
                  <X size={12} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Debatable Topics */}
      <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
        <p className="text-[11px] font-bold tracking-widest text-orange-700 uppercase mb-3">
          Debatable Topics
        </p>
        {debatableTopics.length > 0 ? (
          <ul className="space-y-2">
            {debatableTopics.map((t, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="flex-1 text-sm text-orange-900 leading-snug">{t}</span>
                <button
                  onClick={() => setDebatableTopics((p) => p.filter((_, j) => j !== i))}
                  className="text-orange-400 hover:text-orange-600 transition-colors flex items-center justify-center min-h-[44px] min-w-[44px]"
                  aria-label="Remove topic"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-orange-400 italic">No debatable topics — add one below.</p>
        )}
      </div>

      {/* Constraints & Attributes */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-[11px] font-bold tracking-widest text-blue-700 uppercase mb-3">
          Constraints &amp; Attributes
        </p>
        {attributes.length > 0 ? (
          <ul className="space-y-2">
            {attributes.map((a, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="flex-1 text-sm text-blue-900 leading-snug">{a}</span>
                <button
                  onClick={() => setAttributes((p) => p.filter((_, j) => j !== i))}
                  className="text-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center min-h-[44px] min-w-[44px]"
                  aria-label="Remove attribute"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-blue-400 italic">No constraints — add one below if needed.</p>
        )}
      </div>

      {/* Unified Add a Factor */}
      <AddFactorSection onAdd={handleAdd} />

      {/* Follow-up Questions — only if present and non-empty */}
      {hasQuestions && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-4">
          <div>
            <p className="text-[11px] font-bold tracking-widest text-gray-500 uppercase">
              Optional Clarifications
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Skip these if your intent is already clear
            </p>
          </div>
          {analysis.followUpQuestions!.map((q, i) => (
            <div key={i}>
              <p className="text-sm font-medium text-gray-700 mb-1.5">{q}</p>
              <input
                placeholder="Your answer (optional)…"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-violet-400 min-h-[44px]"
              />
            </div>
          ))}
        </div>
      )}

      {/* Refined Prompt */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-[11px] font-bold tracking-widest text-gray-500 uppercase mb-3">
          Refined Debate Prompt
        </p>
        <textarea
          value={refinedPrompt}
          onChange={(e) => setRefinedPrompt(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-violet-400 resize-none transition-colors"
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={handleConfirm}
          className="flex-1 rounded-xl py-3 text-sm font-semibold text-white transition-opacity min-h-[48px]"
          style={{ backgroundColor: '#7C3AED' }}
        >
          Confirm &amp; Start Debate
        </button>
        <button
          onClick={() => onReanalyze(refinedPrompt)}
          className="flex-1 rounded-xl py-3 text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:border-gray-400 transition-all min-h-[48px]"
        >
          Reanalyze
        </button>
      </div>
    </div>
  );
}
