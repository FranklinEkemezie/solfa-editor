import { Accidental, Letter, Mode, NoteValue, timeSignatureLabel } from '@/domain/music';
import { EditableSelect } from '@/components/ui/editable-select';
import { EditableText } from '@/components/ui/editable-text';
import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';
import { metadataKeyLabel } from '@/features/score-editor/adapters/metadata-label';
import {
    KEY_OPTIONS,
    keyOptionValue,
    TIME_SIGNATURE_OPTIONS,
    timeSignatureOptionValue,
    withCurrentOption,
} from '@/features/score-editor/components/metadata-options';
import {
    makeKey,
    makeTempo,
    makeTimeSignature,
    patchMetadata,
} from '@/features/score-editor/state/score-metadata-commands';

const TEMPO_MIN = 20;
const TEMPO_MAX = 320;

/**
 * The score's masthead.
 *
 * Every detail reads as ordinary sheet-music text and becomes the appropriate
 * control when activated: text becomes an input, and key and time signature
 * open a dropdown. The header owns no state of its own — it reports a whole
 * next document through `onChange`.
 */
export function ScoreHeader({
    document,
    onChange,
}: {
    document: EditorDocument;
    onChange: (next: EditorDocument) => void;
}) {
    const keyValue = keyOptionValue(document.key);
    const timeValue = timeSignatureOptionValue(document.timeSignature);
    const keyOptions = withCurrentOption(KEY_OPTIONS, keyValue, metadataKeyLabel(document));
    const timeOptions = withCurrentOption(
        TIME_SIGNATURE_OPTIONS,
        timeValue,
        timeSignatureLabel(document.timeSignature),
    );

    const setKey = (value: string) => {
        const [letter, mode, accidental, count] = value.split('-');
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
    };

    const setTimeSignature = (value: string) => {
        const [count, note] = value.split('/');
        onChange(
            patchMetadata(document, {
                timeSignature: makeTimeSignature(note as NoteValue, Number(count)),
            }),
        );
    };

    return (
        <header className="w-full">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-green-dark">
                    <span className="text-[10px] font-bold uppercase tracking-[0.17em] text-green">
                        Key
                    </span>
                    <EditableSelect
                        value={keyValue}
                        options={keyOptions}
                        onChange={setKey}
                        label="key"
                    />
                    <span className="text-ghost">·</span>
                    <EditableSelect
                        value={timeValue}
                        options={timeOptions}
                        onChange={setTimeSignature}
                        label="time signature"
                    />
                    <span className="text-ghost">·</span>
                    <span className="text-muted">♩ =</span>
                    <EditableText
                        value={String(document.tempo.beatsPerMinute)}
                        onCommit={(raw) =>
                            onChange(
                                patchMetadata(document, {
                                    tempo: makeTempo(
                                        document.tempo.beatUnit,
                                        Number(raw),
                                        document.tempo.description,
                                    ),
                                }),
                            )
                        }
                        label="tempo"
                        inputClassName="w-16 text-center"
                        inputProps={{
                            type: 'number',
                            min: TEMPO_MIN,
                            max: TEMPO_MAX,
                            inputMode: 'numeric',
                        }}
                        transform={(raw) => {
                            const bpm = Number.parseInt(raw, 10);
                            return Number.isInteger(bpm) && bpm >= TEMPO_MIN && bpm <= TEMPO_MAX
                                ? String(bpm)
                                : null;
                        }}
                    />
                </div>
                <div className="flex items-center gap-1.5 text-sm text-ink-muted sm:justify-end">
                    <span className="italic">By</span>
                    <EditableText
                        value={document.author}
                        onCommit={(author) => onChange(patchMetadata(document, { author }))}
                        label="composer"
                        placeholder="Anonymous"
                    />
                </div>
            </div>

            <div className="mt-4 flex flex-col items-center gap-1">
                <h1 className="text-center font-serif text-3xl font-semibold leading-tight text-ink md:text-4xl">
                    <EditableText
                        value={document.title}
                        onCommit={(title) => onChange(patchMetadata(document, { title }))}
                        label="title"
                        placeholder="Untitled solfa"
                        className="justify-center text-center"
                        inputClassName="w-full max-w-md text-center"
                    />
                </h1>
                <p className="text-sm italic text-muted">
                    <EditableText
                        value={document.tempo.description}
                        onCommit={(description) =>
                            onChange(
                                patchMetadata(document, {
                                    tempo: makeTempo(
                                        document.tempo.beatUnit,
                                        document.tempo.beatsPerMinute,
                                        description,
                                    ),
                                }),
                            )
                        }
                        label="tempo description"
                        placeholder="Add a tempo or mood"
                    />
                </p>
            </div>
        </header>
    );
}
