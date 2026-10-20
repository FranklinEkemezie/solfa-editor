import { useCallback, useState, type KeyboardEvent } from 'react';
import { Accidental, isSolfaSyllable } from '@/domain/music';
import type { ToastTone } from '@/components/feedback/toast-message';
import { playErrorTone } from '@/features/score-editor/audio/play-error-tone';
import {
    applyAccidental,
    composeKey,
    deleteNext,
    deletePrevious,
    insertContinuation,
    insertDuration,
    insertRest,
    insertSyllable,
    moveCaret,
    setNoteOctave,
    type CaretDirection,
    type DurationMark,
    type EditOutcome,
} from '@/features/score-editor/editing/notation-editing';
import {
    nextOctaveStep,
    octaveMark,
    octaveStatus,
    type OctaveDirection,
    type OctaveStep,
} from '@/features/score-editor/editing/octave';
import type { ScoreStore } from '@/features/score-editor/state/score-store';

export type ScoreEditing = {
    /** Key handler for the physical keyboard, attached to the score section. */
    handleKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
    /** Apply one key from the on-screen keyboard. */
    input: (token: string) => void;
    /** Remove the symbol before the caret. */
    backspace: () => void;
    /** The octave the drawn keyboard will write with the next notes. */
    octave: OctaveStep;
    /** Move that selector, and the note already at the caret when there is one. */
    shiftOctave: (direction: OctaveDirection) => void;
};

const ARROW_DIRECTIONS: Readonly<Record<string, CaretDirection>> = {
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowUp: 'up',
    ArrowDown: 'down',
};

const DURATION_MARKS: ReadonlySet<string> = new Set<DurationMark>([':', '.', ',']);

function isTypingInAField(target: EventTarget | null): boolean {
    return (
        target instanceof HTMLElement &&
        target.closest('input, textarea, select, [contenteditable="true"]') !== null
    );
}

/**
 * The bridge between keys and the notation source.
 *
 * Every command is a pure edit on the document, so the on-screen keyboard and
 * the physical keyboard call the same functions. The difference between them
 * is only which key sends what: the phone presses a whole syllable, the
 * keyboard builds one letter by letter.
 */
export function useScoreEditing(
    store: ScoreStore,
    onMessage: (message: string, tone?: ToastTone) => void,
): ScoreEditing {
    /**
     * The register the drawn keyboard is writing in.
     *
     * It lives here rather than inside the keyboard so it survives re-renders
     * of the drawer, and so the note at the caret and the next notes are moved
     * by the same command.
     */
    const [octave, setOctave] = useState<OctaveStep>(0);

    const apply = useCallback(
        (outcome: EditOutcome) => {
            if (outcome.rejected) {
                onMessage(outcome.rejected);
                void playErrorTone();
                return;
            }

            if (outcome.changed) store.commit(outcome.document, outcome.position);
            else store.setPosition(outcome.position);

            if (outcome.status) onMessage(outcome.status, 'info');
        },
        [onMessage, store],
    );

    const input = useCallback(
        (token: string) => {
            const document = store.document;
            const position = store.position;

            if (DURATION_MARKS.has(token)) {
                apply(insertDuration(document, position, token as DurationMark));
                return;
            }
            if (token === ' ' || token === 'rest') {
                apply(insertRest(document, position));
                return;
            }
            if (token === '-') {
                apply(insertContinuation(document, position));
                return;
            }
            if (token === '#') {
                apply(applyAccidental(document, position, Accidental.SHARP));
                return;
            }
            if (token === 'b') {
                apply(applyAccidental(document, position, Accidental.FLAT));
                return;
            }
            if (isSolfaSyllable(token)) {
                apply(insertSyllable(document, position, token, octaveMark(octave)));
                return;
            }

            onMessage(`“${token}” is not part of the notation.`);
            void playErrorTone();
        },
        [apply, octave, onMessage, store.document, store.position],
    );

    const shiftOctave = useCallback(
        (direction: OctaveDirection) => {
            const next = nextOctaveStep(octave, direction);
            setOctave(next);

            // If the writer has just entered a note, the selector acts on that
            // note as well as on the notes that follow. With no note at the
            // caret it only arms the next entry.
            const outcome = setNoteOctave(store.document, store.position, octaveMark(next));
            if (outcome?.rejected) {
                apply(outcome);
                return;
            }
            if (outcome?.changed) {
                store.commit(outcome.document, outcome.position);
                onMessage(`${outcome.status ?? 'Moved the note.'} ${octaveStatus(next)}`, 'info');
                return;
            }

            onMessage(octaveStatus(next), 'info');
        },
        [apply, octave, onMessage, store],
    );

    const backspace = useCallback(() => {
        apply(deletePrevious(store.document, store.position));
    }, [apply, store.document, store.position]);

    const handleKeyDown = useCallback(
        (event: KeyboardEvent<HTMLElement>) => {
            // The masthead's fields sit inside the score section. Their keys are
            // text, not notation, so they must not reach the score.
            if (isTypingInAField(event.target)) return;

            if (event.metaKey || event.ctrlKey) {
                if (event.key.toLowerCase() === 'z') {
                    event.preventDefault();
                    if (event.shiftKey) store.redo();
                    else store.undo();
                } else if (event.key.toLowerCase() === 'y') {
                    event.preventDefault();
                    store.redo();
                }
                return;
            }

            const direction = ARROW_DIRECTIONS[event.key];
            if (direction) {
                event.preventDefault();
                apply(moveCaret(store.document, store.position, direction));
                return;
            }

            if (event.key === 'Backspace') {
                event.preventDefault();
                apply(deletePrevious(store.document, store.position));
                return;
            }
            if (event.key === 'Delete') {
                event.preventDefault();
                apply(deleteNext(store.document, store.position));
                return;
            }

            if (event.key.length !== 1) return;
            event.preventDefault();
            apply(composeKey(store.document, store.position, event.key));
        },
        [apply, store],
    );

    return { handleKeyDown, input, backspace, octave, shiftOctave };
}
