import { timeSignatureLabel, type ScoreDocument } from '@/domain/music';
import { EditableSelect } from '@/components/ui/editable-select';
import { EditableText } from '@/components/ui/editable-text';
import { metadataKeyLabel } from '@/features/score-editor/adapters/metadata-label';
import {
    KEY_OPTIONS,
    keyFromOptionValue,
    keyOptionValue,
    TIME_SIGNATURE_OPTIONS,
    timeSignatureFromOptionValue,
    timeSignatureOptionValue,
    withCurrentOption,
} from '@/features/score-editor/adapters/metadata-options';
import { makeTempo, patchMetadata } from '@/features/score-editor/state/score-metadata-commands';

const TEMPO_MIN = 20;
const TEMPO_MAX = 320;

/**
 * The score's masthead, read as a printed page.
 *
 * The title and its subtitle sit centred at the top; beneath them a single row
 * carries the musical details on the left — key, time signature, tempo and its
 * description — and the composer on the right. Every detail reads as ordinary
 * sheet-music text and becomes the appropriate control when activated: text
 * becomes an input, and key and time signature open a dropdown. The header owns
 * no state of its own — it reports a whole next document through `onChange`.
 */
export function ScoreHeader({
    document,
    onChange,
}: {
    document: ScoreDocument;
    onChange: (next: ScoreDocument) => void;
}) {
    const keyValue = keyOptionValue(document.key);
    const timeValue = timeSignatureOptionValue(document.timeSignature);
    const keyOptions = withCurrentOption(KEY_OPTIONS, keyValue, metadataKeyLabel(document));
    const timeOptions = withCurrentOption(
        TIME_SIGNATURE_OPTIONS,
        timeValue,
        timeSignatureLabel(document.timeSignature),
    );

    const setKey = (value: string) =>
        onChange(patchMetadata(document, { key: keyFromOptionValue(value) }));

    const setTimeSignature = (value: string) =>
        onChange(patchMetadata(document, { timeSignature: timeSignatureFromOptionValue(value) }));

    const setTempoDescription = (description: string) =>
        onChange(
            patchMetadata(document, {
                tempo: makeTempo(
                    document.tempo.beatUnit,
                    document.tempo.beatsPerMinute,
                    description,
                ),
            }),
        );

    return (
        <header className="w-full">
            <div className="flex flex-col items-center gap-0.5">
                <h1 className="w-full text-center font-serif text-3xl font-semibold leading-tight text-ink md:text-4xl">
                    <EditableText
                        value={document.title}
                        onCommit={(title) => onChange(patchMetadata(document, { title }))}
                        label="title"
                        placeholder="Untitled solfa"
                        className="justify-center text-center"
                        inputClassName="w-full max-w-md text-center"
                    />
                </h1>
                <p className="text-base italic text-ink-muted">
                    <EditableText
                        value={document.subtitle}
                        onCommit={(subtitle) => onChange(patchMetadata(document, { subtitle }))}
                        label="subtitle"
                        placeholder="Add a subtitle"
                        className="justify-center text-center"
                        inputClassName="w-full max-w-sm text-center"
                    />
                </p>
            </div>

            <div className="mt-4 flex flex-col gap-1.5 text-sm sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 text-green-dark">
                    <EditableSelect
                        value={keyValue}
                        options={keyOptions}
                        onChange={setKey}
                        label="key"
                    />
                    <span aria-hidden="true" className="text-ghost">
                        ·
                    </span>
                    <EditableSelect
                        value={timeValue}
                        options={timeOptions}
                        onChange={setTimeSignature}
                        label="time signature"
                    />
                    <span aria-hidden="true" className="text-ghost">
                        ·
                    </span>
                    <span className="italic text-ink-muted">
                        <EditableText
                            value={document.tempo.description}
                            onCommit={setTempoDescription}
                            label="tempo description"
                            placeholder="Add a tempo or mood"
                        />
                    </span>
                    <span aria-hidden="true" className="text-ghost">
                        ·
                    </span>
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
                <div className="flex items-baseline gap-1.5 text-ink-muted sm:justify-end">
                    <span className="italic">By</span>
                    <EditableText
                        value={document.author}
                        onCommit={(author) => onChange(patchMetadata(document, { author }))}
                        label="composer"
                        placeholder="Anonymous"
                    />
                </div>
            </div>
        </header>
    );
}
