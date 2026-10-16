import { Accidental, Letter, Mode, NoteValue } from '@/domain/music';
import type { EditorDocument } from '../adapters/editor-document-schema';
import { Field, TextField } from '../../../components/ui/field';
import { Select } from '../../../components/ui/select';
import { makeKey, makeTempo, makeTimeSignature, patchMetadata } from '../state/score-commands';

export function ScoreMetadata({
    document,
    onChange,
}: {
    document: EditorDocument;
    onChange: (next: EditorDocument) => void;
}) {
    return (
        <section className="metadata-card" aria-label="Score metadata">
            <div className="metadata-intro">
                <span className="section-kicker">Score</span>
                <p>Minimal score details.</p>
            </div>
            <div className="metadata-fields metadata-fields-wide">
                <Field label="Title">
                    <TextField
                        value={document.title}
                        onChange={(event) =>
                            onChange(patchMetadata(document, { title: event.target.value }))
                        }
                    />
                </Field>
                <Field label="Author">
                    <TextField
                        value={document.author}
                        onChange={(event) =>
                            onChange(patchMetadata(document, { author: event.target.value }))
                        }
                    />
                </Field>
            </div>
            <div className="metadata-fields">
                <Field label="Key">
                    <Select
                        value={`${document.key.letter}-${document.key.mode}-${document.key.signature.accidental}-${document.key.signature.count}`}
                        onChange={(event) => {
                            const [letter, mode, accidental, count] = event.target.value.split('-');
                            onChange(
                                patchMetadata(document, {
                                    key: makeKey(
                                        letter as Letter,
                                        mode as Mode,
                                        accidental as Accidental,
                                        Number(count),
                                    ),
                                }),
                            );
                        }}
                        options={[
                            ...Object.values(Letter).map((letter) => ({ label: `${letter} major`, value: `${letter}-MAJOR-NATURAL-0` })),
                            { label: 'A minor', value: 'A-MINOR-NATURAL-0' },
                            { label: 'D minor', value: 'D-MINOR-NATURAL-1' },
                            { label: 'G major', value: 'G-MAJOR-SHARP-1' },
                            { label: 'F major', value: 'F-MAJOR-FLAT-1' },
                        ]}
                    />
                </Field>
                <Field label="Time">
                    <Select
                        value={`${document.timeSignature.count}/${document.timeSignature.note}`}
                        onChange={(event) => {
                            const [count, note] = event.target.value.split('/');
                            onChange(
                                patchMetadata(document, {
                                    timeSignature: makeTimeSignature(
                                        note as NoteValue,
                                        Number(count),
                                    ),
                                }),
                            );
                        }}
                        options={[
                            { label: '2/4', value: '2/QUARTER' },
                            { label: '3/4', value: '3/QUARTER' },
                            { label: '4/4', value: '4/QUARTER' },
                            { label: '6/8', value: '6/EIGHTH' },
                        ]}
                    />
                </Field>
                <Field label="Tempo" hint="20–320 BPM">
                    <TextField
                        type="number"
                        min={20}
                        max={320}
                        value={document.tempo.beatsPerMinute}
                        onChange={(event) => {
                            const bpm = Number(event.target.value);
                            if (Number.isInteger(bpm) && bpm >= 20 && bpm <= 320)
                                onChange(
                                    patchMetadata(document, {
                                        tempo: makeTempo(
                                            NoteValue.QUARTER,
                                            bpm,
                                            document.tempo.description,
                                        ),
                                    }),
                                );
                        }}
                    />
                </Field>
            </div>
        </section>
    );
}
