interface Props {
  consensus: string;
}

interface Section {
  heading: string;
  body: string;
}

function parseSections(text: string): Section[] {
  const sections: Section[] = [];
  const parts = text.split(/\n\*\*(.+?)\*\*\n/).filter(Boolean);

  if (parts.length <= 1) {
    // No bold headings found — render as plain paragraphs
    return [{ heading: '', body: text.trim() }];
  }

  // parts alternates: [before-first-heading?, heading, body, heading, body, ...]
  // Find first heading index
  const firstHeadingIdx = text.match(/^\*\*/) ? 0 : 1;
  for (let i = firstHeadingIdx; i < parts.length - 1; i += 2) {
    sections.push({ heading: parts[i].trim(), body: parts[i + 1].trim() });
  }
  return sections;
}

function renderBody(body: string) {
  const lines = body.split('\n').filter((l) => l.trim());
  const bullets = lines.filter((l) => l.trim().startsWith('•') || l.trim().startsWith('-'));
  const isBulletList = bullets.length > 0 && bullets.length === lines.length;

  if (isBulletList) {
    return (
      <ul className="space-y-1.5 mt-2">
        {lines.map((line, i) => (
          <li key={i} className="flex gap-2 text-gray-700 text-sm leading-relaxed">
            <span className="text-amber-500 mt-0.5 flex-shrink-0">•</span>
            <span>{line.replace(/^[•\-]\s*/, '')}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p className="text-gray-700 text-sm leading-relaxed mt-2 whitespace-pre-line">
      {body}
    </p>
  );
}

export function ConsensusSummary({ consensus }: Props) {
  const sections = parseSections(consensus);

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-amber-200 bg-white">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0" />
        <h2 className="text-sm font-bold tracking-widest text-amber-700 uppercase">
          Consensus
        </h2>
      </div>

      {/* Sections */}
      <div className="px-6 py-5 space-y-5">
        {sections.map((section, i) =>
          section.heading ? (
            <div key={i}>
              <h3 className="text-xs font-bold tracking-widest text-amber-700 uppercase mb-1">
                {section.heading}
              </h3>
              {renderBody(section.body)}
            </div>
          ) : (
            <p key={i} className="text-gray-700 text-sm leading-relaxed">
              {section.body}
            </p>
          )
        )}
      </div>
    </div>
  );
}
