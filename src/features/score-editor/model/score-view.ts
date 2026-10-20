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
