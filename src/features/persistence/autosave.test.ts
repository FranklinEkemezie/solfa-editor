import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAutosave } from '@/features/persistence/autosave';

afterEach(() => {
    vi.useRealTimers();
});

describe('the autosave writer', () => {
    it('writes only the newest value once the quiet period ends', async () => {
        vi.useFakeTimers();
        const saved: string[] = [];
        const autosave = createAutosave(async (value: string) => {
            saved.push(value);
        }, 800);

        autosave.schedule('a');
        autosave.schedule('b');
        autosave.schedule('c');

        await vi.advanceTimersByTimeAsync(799);
        expect(saved).toEqual([]);

        await vi.advanceTimersByTimeAsync(1);
        expect(saved).toEqual(['c']);
    });

    it('writes at once when flushed, and does not write again later', async () => {
        vi.useFakeTimers();
        const saved: string[] = [];
        const autosave = createAutosave(async (value: string) => {
            saved.push(value);
        }, 800);

        autosave.schedule('a');
        await autosave.flush();
        expect(saved).toEqual(['a']);

        await vi.advanceTimersByTimeAsync(800);
        expect(saved).toEqual(['a']);
    });

    it('follows an in-flight write with the value that arrived behind it', async () => {
        vi.useFakeTimers();
        const saved: string[] = [];
        const autosave = createAutosave(async (value: string) => {
            saved.push(value);
        }, 800);

        autosave.schedule('a');
        const flight = autosave.flush();
        autosave.schedule('b');

        await flight;

        expect(saved).toEqual(['a', 'b']);
    });

    it('reports that it has work waiting', async () => {
        vi.useFakeTimers();
        const autosave = createAutosave(async () => undefined, 800);

        expect(autosave.isPending()).toBe(false);
        autosave.schedule('a');
        expect(autosave.isPending()).toBe(true);

        await autosave.flush();
        expect(autosave.isPending()).toBe(false);
    });
});
