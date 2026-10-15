import type { EditorDocument } from '../adapters/editor-document-schema';
import { metadataKeyLabel } from '../adapters/editor-to-domain';

export function ScoreHeader({ document }: { document: EditorDocument }) {
  return (
    <div className="score-heading">
      <div>
        <p className="eyebrow">SATB tonic sol-fa editor</p>
        <h1>{document.title || 'Untitled solfa'}</h1>
        <p className="score-author">{document.author ? `by ${document.author}` : 'Anonymous composition'}</p>
      </div>
      <div className="score-summary" aria-label="Score summary">
        <span>{metadataKeyLabel(document)}</span>
        <span className="summary-separator">·</span>
        <span>{document.timeSignature.count}/{noteValueDenominator(document.timeSignature.note)}</span>
        <span className="summary-separator">·</span>
        <span>♩ = {document.tempo.beatsPerMinute}</span>
        {document.tempo.description ? <span className="tempo-description">{document.tempo.description}</span> : null}
      </div>
    </div>
  );
}

function noteValueDenominator(note: EditorDocument['timeSignature']['note']): number {
  const map = { WHOLE: 1, HALF: 2, QUARTER: 4, EIGHTH: 8, SIXTEENTH: 16, THIRTY_SECOND: 32, SIXTY_FOURTH: 64 } as const;
  return map[note];
}
