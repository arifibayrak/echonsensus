'use client';

import { useState } from 'react';
import { CheckCircle2, X, Plus } from 'lucide-react';
import type { EchoAnalysis } from '@/lib/types';

interface Props {
  analysis: EchoAnalysis;
  onConfirm: (edited: EchoAnalysis) => void;
  onReanalyze: (editedTopic: string) => void;
}

export function EchoConfirmation({ analysis, onConfirm, onReanalyze }: Props) {
  const [debatableTopics, setDebatableTopics] = useState(analysis.debatableTopics);
  const [attributes, setAttributes]           = useState(analysis.attributes);
  const [refinedPrompt, setRefinedPrompt]     = useState(analysis.refinedPrompt);
  const [newTopic, setNewTopic]               = useState('');
  const [newAttr, setNewAttr]                 = useState('');

  function addTopic() {
    const t = newTopic.trim();
    if (t) { setDebatableTopics((p) => [...p, t]); setNewTopic(''); }
  }

  function addAttr() {
    const a = newAttr.trim();
    if (a) { setAttributes((p) => [...p, a]); setNewAttr(''); }
  }

  function handleConfirm() {
    onConfirm({ ...analysis, debatableTopics, attributes, refinedPrompt });
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 space-y-5">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">Echo Analysis</h2>
        <p className="text-sm text-gray-400 mt-1">
          Review and refine the analysis before starting the debate
        </p>
      </div>

      {/* Established Facts — read-only */}
      {analysis.facts.length > 0 && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-[11px] font-bold tracking-widest text-green-700 uppercase mb-3">
            Established Facts
          </p>
          <ul className="space-y-2">
            {analysis.facts.map((fact, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-green-900">
                <CheckCircle2 size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Debatable Topics — editable */}
      <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
        <p className="text-[11px] font-bold tracking-widest text-orange-700 uppercase mb-3">
          Debatable Topics
        </p>
        {debatableTopics.length > 0 && (
          <ul className="space-y-2 mb-3">
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
        )}
        <div className="flex gap-2">
          <input
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addTopic(); }}
            placeholder="Add a debatable topic…"
            className="flex-1 rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder-orange-300 focus:outline-none focus:border-orange-400 min-h-[44px]"
          />
          <button
            onClick={addTopic}
            className="flex items-center gap-1.5 rounded-lg border border-orange-300 bg-white px-3 text-xs font-medium text-orange-600 hover:bg-orange-100 transition-colors min-h-[44px]"
          >
            <Plus size={13} /> Add
          </button>
        </div>
      </div>

      {/* Attributes / Constraints — editable */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-[11px] font-bold tracking-widest text-blue-700 uppercase mb-3">
          Constraints &amp; Attributes
        </p>
        {attributes.length > 0 && (
          <ul className="space-y-2 mb-3">
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
        )}
        <div className="flex gap-2">
          <input
            value={newAttr}
            onChange={(e) => setNewAttr(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addAttr(); }}
            placeholder="Add a constraint or attribute…"
            className="flex-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder-blue-300 focus:outline-none focus:border-blue-400 min-h-[44px]"
          />
          <button
            onClick={addAttr}
            className="flex items-center gap-1.5 rounded-lg border border-blue-300 bg-white px-3 text-xs font-medium text-blue-600 hover:bg-blue-100 transition-colors min-h-[44px]"
          >
            <Plus size={13} /> Add
          </button>
        </div>
      </div>

      {/* Follow-up Questions */}
      {analysis.followUpQuestions.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-4">
          <p className="text-[11px] font-bold tracking-widest text-gray-500 uppercase">
            Clarifying Questions
          </p>
          {analysis.followUpQuestions.map((q, i) => (
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
