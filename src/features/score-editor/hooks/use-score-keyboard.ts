import { useCallback, type KeyboardEvent } from 'react';
import type { ToastTone } from '@/components/feedback/toast-message';
import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';
import { playErrorTone } from '@/features/score-editor/audio/play-error-tone';
import { interpretInput } from '@/features/score-editor/editor/input-rules';
import { advanceCursor } from '@/features/score-editor/state/advance-cursor';
import {
    previousPosition,
    type EditorPosition,
} from '@/features/score-editor/state/editor-position';
import { clearSlot } from '@/features/score-editor/state/score-slot-commands';

type ScoreKeyboardOptions = {
    document: EditorDocument;
    position: EditorPosition;
    commit: (document: EditorDocument, position?: EditorPosition) => void;
    moveTo: (position: EditorPosition) => void;
    undo: () => void;
    redo: () => void;
    onMessage: (message: string, tone?: ToastTone) => void;
};

export type ScoreKeyboard = {
    /** Key handler for the physical keyboard, attached to the score canvas. */
    handleKeyDown: (event: KeyboardEvent) => void;
    /** Apply a sol-fa input token (`.`, `,`, `-`, or a syllable) at the caret. */
    input: (token: string) => void;
    /** Clear the caret's slot, stepping back a slot when it is already empty. */
    backspace: () => void;
};

export function useScoreKeyboard({
    document,
    position,
    commit,
    moveTo,
    undo,
    redo,
    onMessage,
}: ScoreKeyboardOptions): ScoreKeyboard {
    const input = useCallback(
        (token: string) => {
            const result = interpretInput(document, position, token);
            if (result.rejected) {
                onMessage(result.rejected);
                void playErrorTone();
                return;
            }
            commit(result.document, result.position);
            if (result.status) onMessage(result.status, 'info');
        },
        [commit, document, onMessage, position],
    );

    const backspace = useCallback(() => {
        const currentSlot = document.measures.find((measure) => measure.id === position.measureId)
            ?.slots[position.slotIndex];
        if (currentSlot?.syllable) {
            commit(clearSlot(document, position), position);
            return;
        }
        const previous = previousPosition(document, position);
        commit(clearSlot(document, previous), previous);
    }, [commit, document, position]);

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (event.metaKey || event.ctrlKey) {
                if (event.key.toLowerCase() === 'z') {
                    event.preventDefault();
                    if (event.shiftKey) redo();
                    else undo();
                }
                if (event.key.toLowerCase() === 'y') {
                    event.preventDefault();
                    redo();
                }
                return;
            }

            if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                event.preventDefault();
                const step = advanceCursor(document, position);
                if (step.document !== document) commit(step.document, step.position);
                else moveTo(step.position);
                return;
            }
            if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                event.preventDefault();
                moveTo(previousPosition(document, position));
                return;
            }
            if (event.key === 'Backspace') {
                event.preventDefault();
                backspace();
                return;
            }
            if (event.key === 'Delete') {
                event.preventDefault();
                commit(clearSlot(document, position), position);
                return;
            }

            if (event.key.length !== 1) return;
            event.preventDefault();
            input(event.key);
        },
        [backspace, commit, document, input, moveTo, position, redo, undo],
    );

    return { handleKeyDown, input, backspace };
}
