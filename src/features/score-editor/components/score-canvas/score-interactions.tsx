import type { ReactNode } from 'react';
import {
    NO_SCORE_INTERACTIONS,
    ScoreInteractionsContext,
    type ScoreInteractions,
} from '@/features/score-editor/components/score-canvas/score-interactions-context';

export function ScoreInteractionsProvider({
    value,
    children,
}: {
    /** Omitted by the printed sheet, which offers no part actions. */
    value?: ScoreInteractions;
    children: ReactNode;
}) {
    return (
        <ScoreInteractionsContext.Provider value={value ?? NO_SCORE_INTERACTIONS}>
            {children}
        </ScoreInteractionsContext.Provider>
    );
}
