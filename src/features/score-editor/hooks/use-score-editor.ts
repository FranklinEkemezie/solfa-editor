import { useCallback, type KeyboardEvent } from 'react';
import type { ToastTone } from '@/components/feedback/toast-message';
import { useLyricEditing } from '@/features/score-editor/hooks/use-lyric-editing';
import { useScoreEditing } from '@/features/score-editor/hooks/use-score-editing';
import type { ScoreStore } from '@/features/score-editor/state/score-store';

/**
 * The editor's input, split into two modes.
 *
 * Notation and lyrics share one physical keyboard and one on-screen keyboard.
 * While a lyric line is open, keys write words; otherwise they write solfa.
 * Keeping the two editors separate means each can stay small and testable,
 * and this hook is the only place that decides which one a key belongs to.
 */
export function useScoreEditor(
    store: ScoreStore,
    onMessage: (message: string, tone?: ToastTone) => void,
) {
    const notation = useScoreEditing(store, onMessage);
    const lyrics = useLyricEditing(store, onMessage);

    const handleKeyDown = useCallback(
        (event: KeyboardEvent<HTMLElement>) => {
            if (lyrics.handleKeyDown(event)) return;
            notation.handleKeyDown(event);
        },
        [lyrics, notation],
    );

    const input = useCallback(
        (token: string) => {
            if (lyrics.input(token)) return;
            notation.input(token);
        },
        [lyrics, notation],
    );

    const backspace = useCallback(() => {
        if (lyrics.input('Backspace')) return;
        notation.backspace();
    }, [lyrics, notation]);

    return {
        ...notation,
        ...lyrics,
        handleKeyDown,
        input,
        backspace,
    };
}

export type ScoreEditor = ReturnType<typeof useScoreEditor>;
