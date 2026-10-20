/** An immutable undo history: what was, what is, and what can be redone. */
export type History<T> = {
    readonly past: readonly T[];
    readonly present: T;
    readonly future: readonly T[];
};

export const HISTORY_LIMIT = 100;

export function createHistory<T>(present: T): History<T> {
    return { past: [], present, future: [] };
}

/**
 * Record a new present.
 *
 * Committing the state that is already present changes nothing and does not
 * create an undo step, which keeps caret-only updates out of the history.
 */
export function commitHistory<T>(history: History<T>, next: T): History<T> {
    if (Object.is(history.present, next)) return history;
    return {
        past: [...history.past, history.present].slice(-HISTORY_LIMIT),
        present: next,
        future: [],
    };
}

export function undoHistory<T>(history: History<T>): History<T> {
    const previous = history.past[history.past.length - 1];
    if (previous === undefined) return history;
    return {
        past: history.past.slice(0, -1),
        present: previous,
        future: [history.present, ...history.future],
    };
}

export function redoHistory<T>(history: History<T>): History<T> {
    const next = history.future[0];
    if (next === undefined) return history;
    return {
        past: [...history.past, history.present],
        present: next,
        future: history.future.slice(1),
    };
}

export function canUndo<T>(history: History<T>): boolean {
    return history.past.length > 0;
}

export function canRedo<T>(history: History<T>): boolean {
    return history.future.length > 0;
}
