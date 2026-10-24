import { Loader2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { TextField } from '@/components/ui/text-field';
import { NoteValue, Tempo, timeSignatureLabel, type ScoreDocument } from '@/domain/music';
import {
    keyFromOptionValue,
    keyLabel,
    keyOptionValue,
    KEY_OPTIONS,
    TIME_SIGNATURE_OPTIONS,
    timeSignatureFromOptionValue,
    timeSignatureOptionValue,
    withCurrentOption,
} from '@/features/score-editor/adapters/metadata-options';
import {
    newDocumentDetails,
    type NewDocumentDetails,
} from '@/features/document-library/document-details';
import type { SaveOutcome } from '@/features/persistence/use-score-persistence';

const TEMPO_MIN = 20;
const TEMPO_MAX = 320;

/**
 * The New document form.
 *
 * Creating a score is intentionally a small, ordinary form: a title and the
 * same musical details the masthead edits, with the current sheet saved before
 * the new one takes its place. Everything the dialog collects goes into the
 * document itself, so the new score's printed heading and its page agree from
 * the first paint.
 */
export function NewDocumentDialog({
    open,
    onOpenChange,
    currentDocument,
    onCreate,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Supplies the musical defaults and the tempo's beat unit. */
    currentDocument: ScoreDocument;
    onCreate: (details: NewDocumentDetails) => Promise<SaveOutcome>;
}) {
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [author, setAuthor] = useState('');
    const [keyValue, setKeyValue] = useState('');
    const [timeValue, setTimeValue] = useState('');
    const [bpm, setBpm] = useState('');
    const [tempoText, setTempoText] = useState('');
    const [beatUnit, setBeatUnit] = useState<NoteValue>(NoteValue.QUARTER);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;

        const details = newDocumentDetails(currentDocument);
        setTitle(details.title);
        setSubtitle(details.subtitle);
        setAuthor(details.author);
        setKeyValue(keyOptionValue(details.key));
        setTimeValue(timeSignatureOptionValue(details.timeSignature));
        setBpm(String(details.tempo.beatsPerMinute));
        setTempoText(details.tempo.description);
        setBeatUnit(details.tempo.beatUnit);
        setSubmitting(false);
        setError(null);
    }, [open, currentDocument]);

    const keyOptions = withCurrentOption(
        KEY_OPTIONS,
        keyValue,
        keyValue ? keyLabel(keyFromOptionValue(keyValue)) : 'Key',
    );
    const timeOptions = withCurrentOption(
        TIME_SIGNATURE_OPTIONS,
        timeValue,
        timeValue ? timeSignatureLabel(timeSignatureFromOptionValue(timeValue)) : 'Time',
    );

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const parsedBpm = Number.parseInt(bpm, 10);
        if (!Number.isInteger(parsedBpm) || parsedBpm < TEMPO_MIN || parsedBpm > TEMPO_MAX) {
            setError(`Tempo must be a whole number from ${TEMPO_MIN} to ${TEMPO_MAX}.`);
            return;
        }
        if (!keyValue || !timeValue) {
            setError('Choose a key and a time signature for the new sheet.');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const result = await onCreate({
                title,
                subtitle,
                author,
                key: keyFromOptionValue(keyValue),
                timeSignature: timeSignatureFromOptionValue(timeValue),
                tempo: new Tempo(beatUnit, parsedBpm, tempoText.trim()),
            });

            if (result.ok) {
                onOpenChange(false);
            } else {
                setError(result.message);
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={submitting ? undefined : onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New document</DialogTitle>
                    <DialogDescription>
                        Your current sheet is saved first. The new sheet starts blank with these
                        details.
                    </DialogDescription>
                </DialogHeader>

                <form className="grid gap-4" onSubmit={submit}>
                    <FormField label="Title">
                        <TextField
                            autoFocus
                            aria-label="Title"
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="Untitled sheet"
                        />
                    </FormField>

                    <FormField label="Subtitle">
                        <TextField
                            aria-label="Subtitle"
                            value={subtitle}
                            onChange={(event) => setSubtitle(event.target.value)}
                            placeholder="Optional"
                        />
                    </FormField>

                    <FormField label="Composer">
                        <TextField
                            aria-label="Composer"
                            value={author}
                            onChange={(event) => setAuthor(event.target.value)}
                            placeholder="Anonymous"
                        />
                    </FormField>

                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Key">
                            <Select value={keyValue} onValueChange={setKeyValue}>
                                <SelectTrigger aria-label="Key">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {keyOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>

                        <FormField label="Time">
                            <Select value={timeValue} onValueChange={setTimeValue}>
                                <SelectTrigger aria-label="Time signature">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {timeOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>
                    </div>

                    <div className="grid grid-cols-[7rem_1fr] gap-3">
                        <FormField label="Tempo" hint="Beats per minute">
                            <TextField
                                aria-label="Tempo in beats per minute"
                                type="number"
                                inputMode="numeric"
                                min={TEMPO_MIN}
                                max={TEMPO_MAX}
                                value={bpm}
                                onChange={(event) => setBpm(event.target.value)}
                            />
                        </FormField>

                        <FormField label="Tempo marking">
                            <TextField
                                aria-label="Tempo marking"
                                value={tempoText}
                                onChange={(event) => setTempoText(event.target.value)}
                                placeholder="Andante"
                            />
                        </FormField>
                    </div>

                    {error ? (
                        <p
                            role="alert"
                            className="rounded-md border border-amber/40 bg-amber/10 px-3 py-2 text-sm text-ink"
                        >
                            {error}
                        </p>
                    ) : null}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={submitting}
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={submitting}>
                            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {submitting ? 'Creating…' : 'Create sheet'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
