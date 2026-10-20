import { describe, expect, it } from 'vitest';
import {
    canRedo,
    canUndo,
    commitHistory,
    createHistory,
    HISTORY_LIMIT,
    redoHistory,
    undoHistory,
} from '@/features/score-editor/state/history';

describe('the edit history', () => {
    it('starts with nothing to undo or redo', () => {
        const history = createHistory('a');

        expect(history.present).toBe('a');
        expect(canUndo(history)).toBe(false);
        expect(canRedo(history)).toBe(false);
    });

    it('records each new present and clears the redo future', () => {
        let history = commitHistory(createHistory('a'), 'b');
        history = commitHistory(history, 'c');

        expect(history.present).toBe('c');
        expect(history.past).toEqual(['a', 'b']);
        expect(canRedo(history)).toBe(false);
    });

    it('does not record the present twice', () => {
        const history = createHistory('a');

        expect(commitHistory(history, 'a')).toBe(history);
    });

    it('walks back and forward through the states', () => {
        let history = commitHistory(commitHistory(createHistory('a'), 'b'), 'c');

        history = undoHistory(history);
        expect(history.present).toBe('b');
        history = undoHistory(history);
        expect(history.present).toBe('a');
        expect(canUndo(history)).toBe(false);

        history = redoHistory(history);
        expect(history.present).toBe('b');
        expect(canRedo(history)).toBe(true);
    });

    it('doing nothing at either end leaves the history alone', () => {
        const start = createHistory('a');
        expect(undoHistory(start)).toBe(start);

        const undone = undoHistory(commitHistory(start, 'b'));
        expect(redoHistory(redoHistory(undone))).toEqual(redoHistory(undone));
    });

    it('drops the oldest step once the limit is reached', () => {
        let history = createHistory(0);
        for (let value = 1; value <= HISTORY_LIMIT + 5; value += 1) {
            history = commitHistory(history, value);
        }

        expect(history.past).toHaveLength(HISTORY_LIMIT);
        expect(history.past[0]).toBe(5);
    });
});
