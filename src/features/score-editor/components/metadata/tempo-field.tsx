import { NoteValue } from '@/domain/music';
import { Field } from '@/components/ui/field';
import { TextField } from '@/components/ui/text-field';
import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';
import { makeTempo, patchMetadata } from '@/features/score-editor/state/score-metadata-commands';

const MIN_BPM = 20;
const MAX_BPM = 320;

export function TempoField({
    document,
    onChange,
}: {
    document: EditorDocument;
    onChange: (next: EditorDocument) => void;
}) {
    return (
        <Field label="Tempo" hint={`${MIN_BPM}–${MAX_BPM} BPM`}>
            <TextField
                type="number"
                min={MIN_BPM}
                max={MAX_BPM}
                value={document.tempo.beatsPerMinute}
                onChange={(event) => {
                    const bpm = Number(event.target.value);
                    if (!Number.isInteger(bpm) || bpm < MIN_BPM || bpm > MAX_BPM) return;
                    onChange(
                        patchMetadata(document, {
                            tempo: makeTempo(NoteValue.QUARTER, bpm, document.tempo.description),
                        }),
                    );
                }}
            />
        </Field>
    );
}
