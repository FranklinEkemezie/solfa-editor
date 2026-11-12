import {
    divideFractions,
    fraction,
    fractionsEqual,
    isZeroFraction,
    type Fraction,
} from '@/domain/music';
import type {
    BeatItemView,
    BeatNoteItemView,
    BeatRestItemView,
    BeatView,
} from '@/features/score-editor/model/score-view';

/**
 * One thing the score draws inside a beat.
 *
 * A rest is kept as a token even though it has no glyph: the subdivision mark
 * before the next event belongs to the silence, and dropping the rest would
 * make an eighth rest followed by an eighth note read as a whole beat on that
 * note.
 */
export type BeatToken =
    | {
          readonly kind: 'note';
          readonly item: BeatNoteItemView;
          readonly markBefore: string | null;
          readonly dotted: boolean;
      }
    | {
          readonly kind: 'rest';
          readonly item: BeatRestItemView;
          readonly markBefore: string | null;
      }
    | {
          readonly kind: 'continuation';
          /** The held note this dash stands for, so its lyric can be drawn. */
          readonly item: BeatNoteItemView;
          readonly markBefore: null;
      };

const HALF = fraction(1, 2);
const QUARTER = fraction(1, 4);
const THREE_QUARTERS = fraction(3, 4);

/**
 * The mark written before an event that begins at `offset` in a beat.
 *
 * Curwen tonic sol-fa divides a beat in half with a full stop and in quarters
 * with commas. The mark belongs to the event's own position, not to its index:
 * an eighth note followed by two sixteenths reads `d.r,m`, not `d,r.m`.
 */
export function subdivisionMarkAt(offset: Fraction, beatDuration: Fraction): string | null {
    if (isZeroFraction(offset)) return null;

    const ratio = divideFractions(offset, beatDuration);
    if (fractionsEqual(ratio, HALF)) return '.';
    if (fractionsEqual(ratio, QUARTER) || fractionsEqual(ratio, THREE_QUARTERS)) return ',';
    return null;
}

/**
 * Whether a note's written duration is dotted within its beat.
 *
 * A dotted value is three halves of the next shorter value: three quarters of
 * a beat, three eighths, and so on. Showing that dot lets a held note be read
 * as `d.,r` rather than as a row of continuation dashes.
 */
export function isDottedWithinBeat(duration: Fraction, beatDuration: Fraction): boolean {
    const ratio = divideFractions(duration, beatDuration);
    return (
        ratio.numerator === 3 &&
        ratio.denominator >= 4 &&
        (ratio.denominator & (ratio.denominator - 1)) === 0
    );
}

function isVisible(item: BeatItemView): item is BeatNoteItemView | BeatRestItemView {
    return item.kind !== 'continuation';
}

/**
 * The tokens a beat draws, in reading order.
 *
 * Continuations are absorbed into the note they extend. A continuation that
 * enters from an earlier beat is still shown as a dash, but one that only
 * carries a note across subdivisions of this beat is represented by the note's
 * dot and the subdivision marks that follow it.
 */
export function beatNotationTokens(beat: BeatView): BeatToken[] {
    const visible = beat.items.filter(isVisible);
    const firstItem = beat.items[0];
    const continuation = firstItem?.kind === 'continuation' ? firstItem : null;

    if (visible.length === 0) {
        return continuation ? [{ kind: 'continuation', item: continuation, markBefore: null }] : [];
    }

    const tokens: BeatToken[] = [];
    if (continuation) {
        tokens.push({ kind: 'continuation', item: continuation, markBefore: null });
    }

    for (const item of visible) {
        const markBefore = subdivisionMarkAt(item.start, beat.duration);

        if (item.kind === 'rest') {
            tokens.push({ kind: 'rest', item, markBefore });
        } else {
            tokens.push({
                kind: 'note',
                item,
                markBefore,
                dotted: isDottedWithinBeat(item.duration, beat.duration),
            });
        }
    }

    return tokens;
}
