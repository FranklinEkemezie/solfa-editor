import { describe, expect, it } from 'vitest';
import {
    BEAT_MARK,
    HALF_BAR_MARK,
    dividesInHalves,
    halfBarAfter,
    markAfterBeat,
} from '@/domain/bar-division';

describe('bar division', () => {
    it('divides a bar of four beats down the middle', () => {
        expect(halfBarAfter(4)).toBe(2);
        expect(markAfterBeat(0, 4)).toBe(BEAT_MARK);
        expect(markAfterBeat(1, 4)).toBe(HALF_BAR_MARK);
        expect(markAfterBeat(2, 4)).toBe(BEAT_MARK);
        expect(markAfterBeat(3, 4)).toBe(BEAT_MARK);
    });

    it('divides six beats into two halves of three', () => {
        expect(halfBarAfter(6)).toBe(3);
        expect(markAfterBeat(1, 6)).toBe(BEAT_MARK);
        expect(markAfterBeat(2, 6)).toBe(HALF_BAR_MARK);
        expect(markAfterBeat(3, 6)).toBe(BEAT_MARK);
    });

    it('reads four minims as two halves, which is what 4/2 means', () => {
        expect(halfBarAfter(4)).toBe(2);
    });

    it('leaves bars of two or three beats undivided', () => {
        expect(dividesInHalves(2)).toBe(false);
        expect(dividesInHalves(3)).toBe(false);
        expect(halfBarAfter(3)).toBeNull();
        expect(markAfterBeat(0, 3)).toBe(BEAT_MARK);
        expect(markAfterBeat(1, 3)).toBe(BEAT_MARK);
    });

    it('leaves a single beat alone', () => {
        expect(halfBarAfter(1)).toBeNull();
    });

    it('divides longer bars at their middle', () => {
        expect(halfBarAfter(8)).toBe(4);
        expect(halfBarAfter(12)).toBe(6);
    });
});
