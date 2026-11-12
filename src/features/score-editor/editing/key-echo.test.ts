import { describe, expect, it } from 'vitest';
import { echoTarget } from '@/features/score-editor/editing/key-echo';

describe('echoing a key on the drawn keyboard', () => {
    it('lights the syllable a letter wrote', () => {
        expect(echoTarget('d')).toBe('d');
        expect(echoTarget('fe')).toBe('fe');
    });

    it('lights the rest key for Space', () => {
        expect(echoTarget(' ')).toBe('rest');
    });

    it('lights the octave keys for the marks that move the register', () => {
        expect(echoTarget("'")).toBe('octave-up');
        expect(echoTarget('1')).toBe('octave-down');
        expect(echoTarget('2')).toBe('octave-down');
    });

    it('lights the rhythmic and editing keys under their own names', () => {
        expect(echoTarget(':')).toBe(':');
        expect(echoTarget('.')).toBe('.');
        expect(echoTarget(',')).toBe(',');
        expect(echoTarget('-')).toBe('-');
        expect(echoTarget('#')).toBe('#');
        expect(echoTarget('b')).toBe('b');
        expect(echoTarget('Backspace')).toBe('Backspace');
    });
});
