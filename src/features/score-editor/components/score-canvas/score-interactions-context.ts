import { createContext, useContext } from 'react';
import type { PartId } from '@/domain/parts';

/** The lyric cell the writer is currently in, or null when lyrics are closed. */
export type LyricTarget = {
    readonly part: PartId;
    readonly noteKey: string;
} | null;

export type ScoreInteractions = {
    /** The note whose lyric cell should show the caret. */
    lyricTarget: LyricTarget;
    /** Add a lyric line to a part, or continue writing one that exists. */
    onBeginLyrics: (part: PartId) => void;
    /** Remove a part's lyric line. */
    onRemoveLyrics: (part: PartId) => void;
};

export const NO_SCORE_INTERACTIONS: ScoreInteractions = {
    lyricTarget: null,
    onBeginLyrics: () => undefined,
    onRemoveLyrics: () => undefined,
};

export const ScoreInteractionsContext = createContext<ScoreInteractions>(NO_SCORE_INTERACTIONS);

/**
 * The part actions the music itself offers.
 *
 * The part labels sit at the head of every system, several levels below the
 * page, while the lyric state lives with the app. A context keeps that one
 * concern from being threaded through every layout component, and gives the
 * printed sheet the same no-op default it needs.
 */
export function useScoreInteractions(): ScoreInteractions {
    return useContext(ScoreInteractionsContext);
}
