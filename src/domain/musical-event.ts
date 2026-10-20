import { compareFractions, ZERO_FRACTION, type Fraction } from '@/domain/fraction';

/**
 * Anything that occupies musical time.
 *
 * Durations are exact quarter-note units stored as fractions, not as note
 * values: a note may be tied across a barline, or last a beat and a half, and
 * neither can be written as a single dotted value without loss.
 */
export abstract class MusicalEvent {
    public readonly duration: Fraction;

    protected constructor(duration: Fraction) {
        if (compareFractions(duration, ZERO_FRACTION) <= 0) {
            throw new Error('A musical event must last longer than nothing.');
        }
        this.duration = duration;
    }
}

export default MusicalEvent;
