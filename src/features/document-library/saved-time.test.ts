import { describe, expect, it } from 'vitest';
import { formatSavedAt } from '@/features/document-library/saved-time';

const NOW = new Date('2026-10-24T12:00:00Z').getTime();
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('the saved-time label', () => {
    it('describes very recent work as just now', () => {
        expect(formatSavedAt(NOW - 10_000, NOW)).toBe('Just now');
    });

    it('counts minutes and hours', () => {
        expect(formatSavedAt(NOW - 5 * MINUTE, NOW)).toBe('5 min ago');
        expect(formatSavedAt(NOW - 3 * HOUR, NOW)).toBe('3 hr ago');
    });

    it('uses yesterday and days for the last week', () => {
        expect(formatSavedAt(NOW - DAY, NOW)).toBe('Yesterday');
        expect(formatSavedAt(NOW - 3 * DAY, NOW)).toBe('3 days ago');
    });

    it('falls back to a calendar date for older work', () => {
        expect(formatSavedAt(NOW - 30 * DAY, NOW)).toMatch(/2026/);
    });
});
