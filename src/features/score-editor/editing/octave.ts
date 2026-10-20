/** Which way the on-screen octave selector moves the notes being entered. */
export type OctaveDirection = 'up' | 'down';

/**
 * How far the entered notes sit from the voice's reference octave.
 *
 * Two octaves is as far as the touch keyboard goes; the physical keyboard can
 * still write any offset the language accepts.
 */
export type OctaveStep = -2 | -1 | 0 | 1 | 2;

/**
 * The next state of the octave selector.
 *
 * Each arrow walks its own side of the register and turns itself off after the
 * second octave: up runs 0 → +1 → +2 → 0, down 0 → -1 → -2 → 0. Pressing the
 * other arrow starts that side afresh, so the two can never both be lit.
 */
export function nextOctaveStep(current: OctaveStep, direction: OctaveDirection): OctaveStep {
    if (direction === 'up') {
        if (current === 1) return 2;
        if (current === 2) return 0;
        return 1;
    }

    if (current === -1) return -2;
    if (current === -2) return 0;
    return -1;
}

/** The raw source mark for an octave step, or the empty string for none. */
export function octaveMark(step: OctaveStep): string {
    switch (step) {
        case 1:
            return "'";
        case 2:
            return "''";
        case -1:
            return '1';
        case -2:
            return '2';
        default:
            return '';
    }
}
