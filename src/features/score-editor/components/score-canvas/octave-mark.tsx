import { cn } from '@/lib/utils';

/**
 * The printed shape of an octave displacement.
 *
 * The language writes an octave above as apostrophes and below as digits. On
 * the page the number of octaves is set as a superscript when the note is
 * raised and as a subscript when it is lowered, so `d'` reads as d¹ and `d1`
 * as d₁. Anything the physical keyboard can write is displayed, not only the
 * two octaves the touch keyboard offers.
 */
export function OctaveMark({ offset, className }: { offset: number; className?: string }) {
    if (offset === 0) return null;

    return (
        <span
            aria-hidden="true"
            className={cn(
                offset > 0 ? 'align-super' : 'align-sub',
                'text-[0.7em] leading-none',
                className,
            )}
        >
            {Math.abs(offset)}
        </span>
    );
}
