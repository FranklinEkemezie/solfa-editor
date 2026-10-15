import type { EditorDocument } from '../score-editor/adapters/editor-document-schema';
import { metadataKeyLabel } from '../score-editor/adapters/editor-to-domain';
import { PARTS } from '../../domain/music';

export function PrintScore({ document }: { document: EditorDocument }) {
  const measures = document.measures.filter((measure) => measure.part === 'soprano').sort((a, b) => a.number - b.number);
  const totalMeasures = measures.length;

  return (
    <main className="print-sheet" id="print-view">
      <header className="print-header">
        <p className="print-eyebrow">SATB tonic sol-fa</p>
        <h1>{document.title || 'Untitled solfa'}</h1>
        <p className="print-author">{document.author ? `by ${document.author}` : 'Anonymous composition'}</p>
        <p className="print-meta">{metadataKeyLabel(document)} · {document.timeSignature.count}/{denominator(document.timeSignature.note)} · ♩ = {document.tempo.beatsPerMinute}</p>
        {document.tempo.description ? <p className="print-tempo">{document.tempo.description}</p> : null}
      </header>

      <div className="print-score" style={{ ['--print-measures' as string]: String(totalMeasures) }}>
        <div className="print-measure-numbers">
          <div className="print-part-name" />
          {measures.map((measure) => (
            <span key={measure.id}>m{measure.number}</span>
          ))}
        </div>

        {PARTS.map((part) => (
          <div className="print-row" key={part.id}>
            <strong>{part.shortLabel}</strong>
            {measures.map((measure) => {
              const partMeasure = document.measures.find((candidate) => candidate.part === part.id && candidate.number === measure.number);
              return (
                <div className="print-measure" key={`${part.id}-${measure.number}`}>
                  {(partMeasure?.slots ?? []).map((slot) => (
                    <span key={slot.id} className={`print-slot ${slot.syllable ? 'print-slot-note' : 'print-slot-empty'}`}>
                      {slot.continuation ? '—' : slot.syllable ?? ':'}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <footer className="print-footer">Solfa editor · composed in the browser</footer>
    </main>
  );
}

function denominator(note: EditorDocument['timeSignature']['note']): number {
  const values = { WHOLE: 1, HALF: 2, QUARTER: 4, EIGHTH: 8, SIXTEENTH: 16, THIRTY_SECOND: 32, SIXTY_FOURTH: 64 } as const;
  return values[note];
}
