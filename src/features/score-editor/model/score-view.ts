import type { Accidental } from '@/domain/accidental';
import type { BeatDivision } from '@/domain/beat-division';
import type { PartId } from '@/domain/parts';
import type { Score } from '@/domain/score';
import type { ScoreDocument } from '@/domain/score-document';
import type { SolfaSyllable } from '@/domain/solfa';
import type { Diagnostic } from '@/features/notation/diagnostics';
import type { VoiceNotation } from '@/features/notation/musical-ir';

/** A note as it appears in one beat of the page. */
export type BeatItemView = {
    /**
     * `note` starts in this beat; `continuation` is the same note still
     * sounding from an earlier beat or measure and is drawn as a dash.
     */
    readonly kind: 'note' | 'continuation';
    /** Stable identity across the score, used to highlight the note being played. */
    readonly noteKey: string;
    readonly syllable: SolfaSyllable;
    /** The explicit `#` or `b` written after the syllable, if any. */
    readonly accidental: Accidental | null;
    readonly octaveOffset: number;
    readonly lyric: string;
};

export type BeatView = {
    readonly number: number;
    /** How the beat is divided, which decides the marks between its notes. */
    readonly division: BeatDivision;
    readonly items: readonly BeatItemView[];
    /** Where the caret goes when this beat is clicked. */
    readonly sourceOffset: number;
};

export type MeasureView = {
    readonly number: number;
    readonly beats: readonly BeatView[];
};

export type PartView = {
    readonly id: PartId;
    readonly label: string;
    readonly shortLabel: string;
    readonly source: string;
    /** Null when the source could not be read; `diagnostics` says why. */
    readonly voice: VoiceNotation | null;
    readonly measures: readonly MeasureView[];
    readonly diagnostics: readonly ScoreDiagnostic[];
};

export type ScoreDiagnostic = Diagnostic & { readonly part: PartId };

/** Everything the page and the player need, derived from one document. */
export type ScoreView = {
    readonly document: ScoreDocument;
    /** The measure-fitted score used for playback, in part order. */
    readonly score: Score;
    readonly parts: Readonly<Record<PartId, PartView>>;
    readonly measureNumbers: readonly number[];
    readonly measureCount: number;
    readonly diagnostics: readonly ScoreDiagnostic[];
};

export type BeatAddress = {
    readonly measure: number;
    readonly beat: number;
};

/**
 * The beat a caret offset belongs to in one part.
 *
 * At the end of a voice the caret appends, so the marker points at the last
 * beat that holds music rather than at a later, still blank measure. Inside the
 * voice, the last beat whose event ends exactly at the caret is the one the
 * writer is working in; after a duration, the first beat beyond it is used.
 */
export function activeBeat(part: PartView, offset: number): BeatAddress | null {
    const firstMeasure = part.measures[0];
    const firstBeat = firstMeasure?.beats[0];
    if (!firstMeasure || !firstBeat) return null;

    // An empty voice has no written event to point at; the score starts at its
    // first beat.
    if (part.source.length === 0) {
        return { measure: firstMeasure.number, beat: firstBeat.number };
    }

    if (offset >= part.source.length) {
        const written = lastWrittenBeat(part);
        if (written) return written;
    }

    let ending: BeatAddress | null = null;
    let after: BeatAddress | null = null;
    let last: BeatAddress = { measure: firstMeasure.number, beat: firstBeat.number };

    for (const measure of part.measures) {
        for (const beat of measure.beats) {
            last = { measure: measure.number, beat: beat.number };
            if (beat.sourceOffset === offset) {
                ending = last;
            } else if (!after && beat.sourceOffset > offset) {
                after = last;
            }
        }
    }

    return ending ?? after ?? last;
}

/** The last beat anywhere in the part that holds at least one written event. */
function lastWrittenBeat(part: PartView): BeatAddress | null {
    let written: BeatAddress | null = null;

    for (const measure of part.measures) {
        for (const beat of measure.beats) {
            if (beat.items.length > 0) {
                written = { measure: measure.number, beat: beat.number };
            }
        }
    }

    return written;
}
