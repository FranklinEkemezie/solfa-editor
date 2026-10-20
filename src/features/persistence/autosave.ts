/**
 * A small debounced writer for values that change faster than they should be
 * stored.
 *
 * The latest value always wins: scheduling again before the quiet period ends
 * replaces the waiting value, and a save already in flight is followed by one
 * more write of the newest value rather than a write for every keystroke. That
 * is what keeps autosave cheap while still making the stored score catch up.
 */
export type Autosave<Value> = {
    /** Ask for `value` to be written after the quiet period. */
    schedule: (value: Value) => void;
    /** Write the newest value now and wait for any in-flight write to finish. */
    flush: () => Promise<void>;
    /** True while a write is waiting, running, or still queued behind one. */
    isPending: () => boolean;
};

export function createAutosave<Value>(
    save: (value: Value) => Promise<void>,
    delayMs: number,
): Autosave<Value> {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let queued: Value;
    let hasQueued = false;
    let flight: Promise<void> | null = null;

    const drain = async () => {
        while (hasQueued) {
            const value = queued;
            hasQueued = false;
            await save(value);
        }
    };

    const flush = (): Promise<void> => {
        if (timer !== null) {
            clearTimeout(timer);
            timer = null;
        }

        if (flight) return flight;

        flight = drain().finally(() => {
            flight = null;
        });
        return flight;
    };

    const schedule = (value: Value) => {
        queued = value;
        hasQueued = true;

        if (timer !== null) clearTimeout(timer);
        timer = setTimeout(() => {
            timer = null;
            void flush().catch(() => undefined);
        }, delayMs);
    };

    return {
        schedule,
        flush,
        isPending: () => timer !== null || hasQueued || flight !== null,
    };
}
