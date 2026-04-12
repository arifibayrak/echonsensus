'use client';

import type { CritiqueEntry, ModelId } from '@/lib/types';
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

// ─── Grid content ─────────────────────────────────────────────────────────────

function CritiqueGridContent({
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
      className={`grid gap-3 grid-cols-1 sm:grid-cols-${n}`}
      style={n > 1 ? { gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` } : undefined}
    >
      {selectedModels.map((fromModel) => {
        const fromCfg = MODELS[fromModel];
        const targets = selectedModels.filter((m) => m !== fromModel);
        return (
          <div key={fromModel} className="flex flex-col gap-2">
            <div
              className="flex items-center gap-1.5 pb-2 border-b"
              style={{ borderColor: fromCfg.color + '40' }}
            >
              <ModelDot modelId={fromModel} />
              <span
                className="text-xs font-bold truncate"
                style={{ color: fromCfg.color }}
              >
                {fromCfg.name}
              </span>
            </div>
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
                    <span
                      className="text-xs font-semibold"
                      style={{ color: aboutCfg.color }}
                    >
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
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {renderMd(critique.text)}
                  </p>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ─── Exported wrapper ─────────────────────────────────────────────────────────

interface Props {
  critiques: CritiqueEntry[];
  selectedModels: ModelId[];
  loading: boolean;
}

export function CritiqueGrid({ critiques, selectedModels, loading }: Props) {
  const agreeCt    = critiques.filter((c) => !c.isDisagreement).length;
  const disagreeCt = critiques.filter((c) => c.isDisagreement).length;
  const badge =
    critiques.length > 0
      ? `${agreeCt} agree · ${disagreeCt} disagree`
      : loading
      ? 'loading…'
      : undefined;

  return (
    <CollapsibleSection title="Cross-Critique" badge={badge}>
      <CritiqueGridContent
        critiques={critiques}
        selectedModels={selectedModels}
        loading={loading}
      />
    </CollapsibleSection>
  );
}
