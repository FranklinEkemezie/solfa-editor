import { Accidental, Letter, Mode, NoteValue } from '../../../domain/music';
import type { EditorDocument } from '../adapters/editor-document-schema';
import { Field, SelectField, TextField } from '../../../components/ui/field';
import { makeKey, makeTempo, makeTimeSignature, patchMetadata } from '../state/score-commands';

export function ScoreMetadata({ document, onChange }: { document: EditorDocument; onChange: (next: EditorDocument) => void }) {
  return (
    <section className="metadata-card" aria-label="Score metadata">
      <div className="metadata-intro">
        <span className="section-kicker">Score</span>
        <p>Minimal score details.</p>
      </div>
      <div className="metadata-fields metadata-fields-wide">
        <Field label="Title">
          <TextField value={document.title} onChange={(event) => onChange(patchMetadata(document, { title: event.target.value }))} />
        </Field>
        <Field label="Author">
          <TextField value={document.author} onChange={(event) => onChange(patchMetadata(document, { author: event.target.value }))} />
        </Field>
      </div>
      <div className="metadata-fields">
        <Field label="Key">
          <SelectField
            value={`${document.key.letter}-${document.key.mode}-${document.key.signature.accidental}-${document.key.signature.count}`}
            onChange={(event) => {
              const [letter, mode, accidental, count] = event.target.value.split('-');
              onChange(patchMetadata(document, { key: makeKey(letter as Letter, mode as Mode, accidental as Accidental, Number(count)) }));
            }}
          >
            {Object.values(Letter).map((letter) => (
              <option key={letter} value={`${letter}-MAJOR-NATURAL-0`}>{letter} major</option>
            ))}
            <option value="A-MINOR-NATURAL-0">A minor</option>
            <option value="D-MINOR-NATURAL-1">D minor</option>
            <option value="G-MAJOR-SHARP-1">G major</option>
            <option value="F-MAJOR-FLAT-1">F major</option>
          </SelectField>
        </Field>
        <Field label="Time">
          <SelectField
            value={`${document.timeSignature.count}/${document.timeSignature.note}`}
            onChange={(event) => {
              const [count, note] = event.target.value.split('/');
              onChange(patchMetadata(document, { timeSignature: makeTimeSignature(note as NoteValue, Number(count)) }));
            }}
          >
            <option value="2/QUARTER">2/4</option>
            <option value="3/QUARTER">3/4</option>
            <option value="4/QUARTER">4/4</option>
            <option value="6/EIGHTH">6/8</option>
          </SelectField>
        </Field>
        <Field label="Tempo" hint="20–320 BPM">
          <TextField
            type="number"
            min={20}
            max={320}
            value={document.tempo.beatsPerMinute}
            onChange={(event) => {
              const bpm = Number(event.target.value);
              if (Number.isInteger(bpm) && bpm >= 20 && bpm <= 320) onChange(patchMetadata(document, { tempo: makeTempo(NoteValue.QUARTER, bpm, document.tempo.description) }));
            }}
          />
        </Field>
        <Field label="Lyrics" hint="One line">
          <TextField
            value={document.lyrics}
            placeholder="e.g. Holy, holy, holy"
            onChange={(event) => onChange({ ...document, lyrics: event.target.value })}
          />
        </Field>
      </div>
    </section>
  );
}
