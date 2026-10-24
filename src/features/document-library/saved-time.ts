const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * How a saved score's age reads in the document list.
 *
 * Recent work is described in the units a person would use ("5 min ago"), and
 * older work settles into a calendar date. The clock is passed in so the
 * wording can be tested without freezing the test runner.
 */
export function formatSavedAt(savedAt: number, now = Date.now()): string {
    const elapsed = Math.max(0, now - savedAt);

    if (elapsed < 45_000) return 'Just now';
    if (elapsed < 90 * 1_000) return '1 min ago';
    if (elapsed < HOUR) return `${Math.round(elapsed / MINUTE)} min ago`;
    if (elapsed < 2 * HOUR) return '1 hr ago';
    if (elapsed < DAY) return `${Math.round(elapsed / HOUR)} hr ago`;
    if (elapsed < 2 * DAY) return 'Yesterday';
    if (elapsed < 7 * DAY) return `${Math.floor(elapsed / DAY)} days ago`;

    return new Intl.DateTimeFormat(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(savedAt);
}

/** The full date used in the detail panel beneath the document picker. */
export function formatSavedDate(savedAt: number): string {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(savedAt);
}
