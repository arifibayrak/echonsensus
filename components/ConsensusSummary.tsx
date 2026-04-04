'use client';

import React from 'react';

interface Section {
  heading: string;
  body: string;
}

// Pre-clean: strip --- separators and NOTE: prefixes, trim excess whitespace
function preClean(raw: string): string {
  return raw
    .replace(/^---+\s*$/gm, '')           // remove --- lines
    .replace(/^NOTE:\s*/gim, '')          // remove NOTE: prefix
    .replace(/\n{3,}/g, '\n\n')           // collapse 3+ newlines
    .trim();
}

// Split on **Heading** occurrences anywhere in the text (inline or on its own line)
function parseSections(raw: string): Section[] {
  const cleaned = preClean(raw);
  // parts alternates: [before, heading1, after1, heading2, after2, ...]
  const parts = cleaned.split(/\*\*([A-Za-z][^*\n]{2,60})\*\*/);

  if (parts.length <= 1) {
    return [{ heading: '', body: cleaned.trim() }];
  }

  const sections: Section[] = [];
  // Start at index 1 (first captured heading); skip parts[0] (preamble before first heading)
  for (let i = 1; i < parts.length - 1; i += 2) {
    const heading = parts[i].trim();
    const body    = parts[i + 1].replace(/^\s*\n/, '').trim(); // strip leading blank line
    if (heading) sections.push({ heading, body });
  }
  return sections.length > 0 ? sections : [{ heading: '', body: raw.trim() }];
}

// Bullet points may be newline-separated OR inline (• A • B • C on one line)
function splitBullets(text: string): string[] {
  // Normalise: every bullet marker → newline + marker
  const normalised = text.replace(/([^\n])\s*•\s*/g, '$1\n• ');
  return normalised
    .split('\n')
    .map((l) => l.replace(/^[•\-]\s*/, '').trim())
    .filter(Boolean);
}

// Render inline **bold** and *italic* markers
function renderInline(text: string): React.ReactNode {
  // Split on **bold** first, then handle *italic* within plain segments
  const boldParts = text.split(/\*\*([^*]+)\*\*/);
  if (boldParts.length === 1) {
    // No bold — check for italic
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
          <strong key={i} className="font-semibold text-gray-900">{p}</strong>
        ) : (
          // Also handle *italic* within non-bold segments
          renderInline(p) as React.ReactElement
        )
      )}
    </>
  );
}

function renderBody(body: string, accentColor: string) {
  const hasBullets = /(?:^|\n)\s*[•\-]\s+/.test(body) || body.includes('•');

  if (hasBullets) {
    const bullets = splitBullets(body);
    return (
      <ul className="mt-3 space-y-2.5">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-3 text-sm text-gray-700 leading-relaxed">
            <span
              className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: accentColor }}
            />
            <span>{renderInline(b)}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p className="mt-2 text-sm text-gray-700 leading-relaxed">
      {renderInline(body)}
    </p>
  );
}

// Per-section styling
const SECTION_META: Record<string, { label: string; accent: string; labelColor: string; borderColor: string; bg: string }> = {
  'Consensus Position': {
    label: 'CONSENSUS POSITION',
    accent: '#7C3AED',
    labelColor: 'text-violet-600',
    borderColor: 'border-violet-200',
    bg: 'bg-violet-50',
  },
  'What Everyone Agreed On': {
    label: 'AGREED ON',
    accent: '#10B981',
    labelColor: 'text-emerald-600',
    borderColor: 'border-emerald-200',
    bg: 'bg-emerald-50',
  },
  'Where They Disagreed': {
    label: 'DISAGREEMENTS',
    accent: '#F97316',
    labelColor: 'text-orange-500',
    borderColor: 'border-orange-200',
    bg: 'bg-orange-50',
  },
  'Final Synthesis': {
    label: 'FINAL SYNTHESIS',
    accent: '#3B82F6',
    labelColor: 'text-blue-600',
    borderColor: 'border-blue-200',
    bg: 'bg-blue-50',
  },
};

const DEFAULT_META = {
  label: 'NOTE',
  accent: '#9ca3af',
  labelColor: 'text-gray-400',
  borderColor: 'border-gray-200',
  bg: 'bg-gray-50',
};

export function ConsensusSummary({ consensus }: { consensus: string }) {
  const sections = parseSections(consensus);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      {/* Card header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0" />
        <span className="text-xs font-bold tracking-[0.2em] text-amber-600 uppercase">
          Consensus
        </span>
      </div>

      {/* Sections */}
      <div className="p-6 space-y-4">
        {sections.map((section, i) => {
          const meta = SECTION_META[section.heading] ?? DEFAULT_META;

          return (
            <div
              key={i}
              className={`rounded-xl border px-5 py-4 ${meta.bg} ${meta.borderColor}`}
            >
              {section.heading && (
                <p className={`text-[11px] font-bold tracking-widest ${meta.labelColor} uppercase mb-1`}>
                  {meta.label}
                </p>
              )}
              {renderBody(section.body, meta.accent)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
