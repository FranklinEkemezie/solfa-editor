import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { NOTE_VALUE_ORDER, noteValueLabel, type NoteValue } from '@/domain/music';
import { NoteValueGlyph } from '@/features/score-editor/components/note-value-glyph';
import { cn } from '@/lib/utils';

type TempoBeatUnitSelectProps = {
    value: NoteValue;
    onChange: (value: NoteValue) => void;
    /** `masthead` reads as printed text; `field` is a normal form control. */
    variant?: 'masthead' | 'field';
    className?: string;
};

/**
 * Choose which note value the tempo's BPM counts.
 *
 * A metronome mark is a note symbol and a number: a half note at 72 is a
 * different speed from a quarter note at 72. The symbol is the control, so the
 * masthead still reads like a printed heading while the same value can be
 * changed from the New document form.
 */
export function TempoBeatUnitSelect({
    value,
    onChange,
    variant = 'field',
    className,
}: TempoBeatUnitSelectProps) {
    const label = noteValueLabel(value);

    return (
        <Select value={value} onValueChange={(next) => onChange(next as NoteValue)}>
            <SelectTrigger
                aria-label={variant === 'masthead' ? `Tempo beat unit: ${label}` : 'Beat unit'}
                className={cn(
                    '[&>span]:line-clamp-none',
                    variant === 'masthead' &&
                        'h-auto w-auto gap-1 rounded-md border-0 bg-transparent px-1.5 py-0.5 text-sm font-medium text-muted hover:bg-green-wash focus:border-0 focus:ring-2 focus:ring-green/30',
                    className,
                )}
            >
                <span className="flex min-w-0 items-center gap-2">
                    <NoteValueGlyph value={value} className="h-5 w-4" />
                    {variant === 'field' ? <span className="truncate">{label}</span> : null}
                </span>
            </SelectTrigger>
            <SelectContent>
                {NOTE_VALUE_ORDER.map((option) => (
                    <SelectItem key={option} value={option}>
                        <span className="flex items-center gap-2">
                            <NoteValueGlyph value={option} className="h-5 w-4" />
                            <span>{noteValueLabel(option)}</span>
                        </span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
