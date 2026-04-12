'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ModelId, PositionEntry } from '@/lib/types';
import { MODELS } from '@/lib/models';
import { CollapsibleSection } from './ui/CollapsibleSection';

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

// ─── Content-type detection for full text ────────────────────────────────────

function renderFullText(text: string): React.ReactNode {
  const isTable = /\|[-: ]+\|/.test(text);
  const imageMatch = text.match(/https?:\/\/\S+\.(png|jpg|gif|webp)/i);

  if (isTable) {
    const lines = text
      .trim()
      .split('\n')
      .filter((l) => l.includes('|'));
    const rows = lines.map((l) =>
      l.split('|').filter((c) => c.trim() !== '').map((c) => c.trim())
    );
    const [header, , ...body] = rows; // skip separator row
    return (
      <div className="overflow-x-auto mt-3 pt-3 border-t border-gray-100">
        <table className="text-xs w-full">
          <thead>
            <tr>
              {header?.map((h, i) => (
                <th key={i} className="px-2 py-1 text-left font-semibold text-gray-700 border-b border-gray-200">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, i) => (
              <tr key={i} className="border-b border-gray-50">
                {row.map((cell, j) => (
                  <td key={j} className="px-2 py-1 text-gray-600">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (imageMatch) {
    return (
      <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
        <img src={imageMatch[0]} alt="Content" className="max-w-full rounded" />
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
          {renderMd(text.replace(imageMatch[0], '').trim())}
        </p>
      </div>
    );
  }

  return (
    <p className="text-sm text-gray-600 leading-relaxed mt-3 pt-3 border-t border-gray-100 whitespace-pre-line">
      {renderMd(text)}
    </p>
  );
}

// ─── Single position card ─────────────────────────────────────────────────────

function PositionCard({ entry, pending }: { entry: PositionEntry | null; pending?: boolean }) {
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
          {expanded && renderFullText(entry.fullText)}
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

// ─── Exported wrapper ─────────────────────────────────────────────────────────

interface Props {
  positions: PositionEntry[];
  pendingPositions: ModelId[];
  isLoading: boolean;
}

export function PositionCards({ positions, pendingPositions, isLoading }: Props) {
  const total = positions.length + pendingPositions.length;
  const badge = `${positions.length} of ${total} model${total !== 1 ? 's' : ''}`;

  return (
    <CollapsibleSection title="Initial Positions" badge={badge}>
      <div className="space-y-3">
        {positions.map((entry) => (
          <PositionCard key={entry.model} entry={entry} />
        ))}
        {isLoading &&
          pendingPositions.map((modelId) => (
            <PositionCard key={modelId} entry={null} pending />
          ))}
      </div>
    </CollapsibleSection>
  );
}
