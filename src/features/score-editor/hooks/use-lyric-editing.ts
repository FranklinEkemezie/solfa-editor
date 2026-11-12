import { useCallback, useState, type KeyboardEvent } from 'react';
import { PARTS, type PartId } from '@/domain/parts';
import {
    appendToSyllable,
    clearLyricLine,
    deleteLastCharacter,
    ensureLyricLine,
    lyricAnchors,
} from '@/features/score-editor/editing/lyrics';
import { isTypingInAField } from '@/features/score-editor/editing/keyboard-target';
import type { ScoreStore } from '@/features/score-editor/state/score-store';
import type { ToastTone } from '@/components/feedback/toast-message';

/** Where the lyric caret is: a part, a note cell, and the note's identity. */
export type LyricTarget = {
    readonly part: PartId;
    readonly index: number;
    readonly noteKey: string;
    readonly count: number;
};

export type LyricEditing = {
    target: LyricTarget | null;
    /** Add (or continue) a lyric line and put the caret on its first empty note. */
    begin: (part: PartId) => void;
    /** Remove a part's whole lyric line. */
    remove: (part: PartId) => void;
    /** Leave lyric mode without removing what was written. */
    exit: () => void;
    /** Move the lyric caret to the next note. */
    advance: () => void;
    /** Move the lyric caret to the previous note. */
    retreat: () => void;
    /** Handle a physical key; true when lyric mode consumed it. */
    handleKeyDown: (event: KeyboardEvent<HTMLElement>) => boolean;
    /** Handle one on-screen key; true when lyric mode consumed it. */
    input: (token: string) => boolean;
};

function partLabel(part: PartId): string {
    return PARTS.find((definition) => definition.id === part)?.label ?? part;
}

/**
 * The lyric line, as a place to type.
 *
 * Lyrics are a second layer over the notes: one syllable per note that begins,
 * in order. Rests and held notes are not cells, so Space always moves to the
 * next note a singer would actually sing. The line is stored on the document,
 * which means undo, autosave and `.solfa` files carry it without special cases.
 */
export function useLyricEditing(
    store: ScoreStore,
    onMessage: (message: string, tone?: ToastTone) => void,
): LyricEditing {
    const [target, setTarget] = useState<LyricTarget | null>(null);

    const moveTo = useCallback(
        (part: PartId, index: number, count: number, noteKey: string) => {
            setTarget({ part, index, noteKey, count });
            const anchor = lyricAnchors(store.view, part)[index];
            if (anchor) store.setPosition({ part, offset: anchor.sourceOffset });
        },
        [store],
    );

    const begin = useCallback(
        (part: PartId) => {
            const anchors = lyricAnchors(store.view, part);
            if (anchors.length === 0) {
                onMessage(`Write a note in ${partLabel(part)} before adding lyrics.`);
                return;
            }

            const next = ensureLyricLine(store.document, part, anchors.length);
            if (next !== store.document) store.commit(next);

            const line = next.lyricsByPart[part];
            const firstEmpty = line.findIndex((syllable) => syllable.trim() === '');
            const index = firstEmpty === -1 ? 0 : Math.min(firstEmpty, anchors.length - 1);

            moveTo(part, index, anchors.length, anchors[index].noteKey);
            onMessage(
                `Writing lyrics for ${partLabel(part)}. Type a syllable, Space for the next note, Esc when done.`,
                'info',
            );
        },
        [moveTo, onMessage, store],
    );

    const remove = useCallback(
        (part: PartId) => {
            if (target?.part === part) setTarget(null);
            store.commit(clearLyricLine(store.document, part));
            onMessage(`Removed the ${partLabel(part)} lyric line.`, 'info');
        },
        [onMessage, store, target],
    );

    const exit = useCallback(() => setTarget(null), []);

    const advance = useCallback(() => {
        if (!target) return;
        const anchors = lyricAnchors(store.view, target.part);
        const next = target.index + 1;

        if (next >= anchors.length) {
            onMessage('That is the last note in the lyric line.', 'info');
            return;
        }

        moveTo(target.part, next, anchors.length, anchors[next].noteKey);
    }, [moveTo, onMessage, store.view, target]);

    const retreat = useCallback(() => {
        if (!target || target.index === 0) return;
        const anchors = lyricAnchors(store.view, target.part);
        const previous = target.index - 1;
        moveTo(target.part, previous, anchors.length, anchors[previous].noteKey);
    }, [moveTo, store.view, target]);

    const typeText = useCallback(
        (text: string) => {
            if (!target) return;
            store.commit(appendToSyllable(store.document, target.part, target.index, text));
        },
        [store, target],
    );

    const backspace = useCallback(() => {
        if (!target) return;
        const result = deleteLastCharacter(store.document, target.part, target.index);
        if (!result.removed) return;

        store.commit(result.document);
        if (result.index !== target.index) {
            const anchors = lyricAnchors(store.view, target.part);
            const anchor = anchors[result.index];
            if (anchor) {
                setTarget({ ...target, index: result.index, noteKey: anchor.noteKey });
            }
        }
    }, [store, target]);

    const handleKeyDown = useCallback(
        (event: KeyboardEvent<HTMLElement>): boolean => {
            if (!target) return false;
            if (isTypingInAField(event.target)) return false;

            // Undo and redo still belong to the document, not the lyric caret.
            if (event.metaKey || event.ctrlKey) return false;

            if (event.key === 'Escape' || event.key === 'Enter') {
                event.preventDefault();
                exit();
                return true;
            }
            if (event.key === ' ') {
                event.preventDefault();
                advance();
                return true;
            }
            if (event.key === 'Backspace') {
                event.preventDefault();
                backspace();
                return true;
            }
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                advance();
                return true;
            }
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                retreat();
                return true;
            }
            if (event.key === 'Tab') return false;

            if (event.key.length === 1) {
                event.preventDefault();
                typeText(event.key);
                return true;
            }

            // Other keys (function keys, modifiers) are not notation either.
            return true;
        },
        [advance, backspace, exit, retreat, target, typeText],
    );

    const input = useCallback(
        (token: string): boolean => {
            if (!target) return false;
            if (token === ' ' || token === 'rest') {
                advance();
                return true;
            }
            if (token === 'Backspace') {
                backspace();
                return true;
            }
            typeText(token);
            return true;
        },
        [advance, backspace, target, typeText],
    );

    return { target, begin, remove, exit, advance, retreat, handleKeyDown, input };
}
