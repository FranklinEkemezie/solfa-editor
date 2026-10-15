import type { Editor } from '@tiptap/core';
import { EditorContent } from '@tiptap/react';
import type { EditorDocument } from '../adapters/editor-document-schema';
import type { EditorPosition } from '../state/score-commands';
import { calculateScoreLayout } from '../layout/calculate-score-layout';
import { PARTS } from '../../../domain/music';

export function ScoreCanvas({
  document,
  position,
  editor,
  onPositionChange,
  onKeyDown,
}: {
  document: EditorDocument;
  position: EditorPosition;
  editor: Editor;
  onPositionChange: (position: EditorPosition) => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
}) {
  const layout = calculateScoreLayout(document);
  const measureById = new Map(document.measures.map((measure) => [measure.id, measure]));

  return (
    <section className="score-card" aria-label="SATB score editor">
      <div className="score-scroll" onKeyDown={onKeyDown} onClick={() => editor.commands.focus()}>
        <div className="score-ruler">
          <div className="part-label-spacer" />
          <div className="measure-sequence measure-sequence-ruler">
            {layout.measures.map((measure) => <div key={measure.measureId} className="measure-ruler-cell" style={{ width: measure.width }}>m{measure.number}</div>)}
          </div>
        </div>
        <div className="score-body">
          <div className="part-labels">
            {PARTS.map((part) => <div key={part.id} className="part-label" title={part.label}>{part.shortLabel}<span>{part.label}</span></div>)}
          </div>
          <div className="measure-sequence">
            {layout.measures.map((layoutMeasure, measurePosition) => (
              <div key={layoutMeasure.measureId} className={`measure-block ${measurePosition === layout.measures.length - 1 ? 'measure-block-final' : ''}`} style={{ width: layoutMeasure.width }}>
                {PARTS.map((part) => {
                  const measure = document.measures.find((candidate) => candidate.id === `${part.id}-${layoutMeasure.number}`) ?? measureById.get(layoutMeasure.measureId);
                  if (!measure) return null;
                  return <PartMeasure key={part.id} measure={measure} position={position} onPositionChange={onPositionChange} />;
                })}
              </div>
            ))}
          </div>
        </div>
        {document.lyrics ? (
          <div className="lyrics-panel">
            <div className="lyrics-row">
              <span className="lyrics-label">Lyrics</span>
              <div className="lyrics-value">{document.lyrics}</div>
            </div>
          </div>
        ) : null}
        <EditorContent editor={editor} className="editor-capture" />
      </div>
    </section>
  );
}

function PartMeasure({
  measure,
  position,
  onPositionChange,
}: {
  measure: EditorDocument['measures'][number];
  position: EditorPosition;
  onPositionChange: (position: EditorPosition) => void;
}) {
  return (
    <div className="part-measure">
      {measure.slots.map((slot, slotIndex) => {
        const isActive = position.measureId === measure.id && position.slotIndex === slotIndex;
        return (
          <button
            key={slot.id}
            type="button"
            className={`rhythm-slot ${slot.syllable ? 'rhythm-slot-filled' : 'rhythm-slot-empty'} ${isActive ? 'rhythm-slot-active' : ''}`}
            onClick={(event) => {
              event.stopPropagation();
              onPositionChange({ measureId: measure.id, slotIndex });
            }}
            aria-label={`${measure.part}, measure ${measure.number}, position ${slotIndex + 1}${slot.syllable ? `, ${slot.syllable}` : ', empty'}`}
          >
            <span className="slot-note">{slot.continuation ? '—' : slot.syllable ?? ':'}</span>
            {slot.noteValue !== 'QUARTER' ? <span className="slot-subdivision">{slot.noteValue === 'EIGHTH' ? '½' : '·'}</span> : null}
            {!slot.syllable && slot.noteValue === 'QUARTER' ? <span className="slot-separator">:</span> : null}
          </button>
        );
      })}
    </div>
  );
}
