/**
 * How a bar is divided for reading.
 *
 * A beat is divided inside itself — with dots and commas — and that is
 * `beat-division.ts`. This is the other division: the one across the bar.
 *
 * Curwen sol-fa writes the beats of a bar in a line and closes each beat with a
 * colon, but a bar that divides into two halves has a middle as well as beats.
 * Four crotchets are read "one two, three four" and six quavers "one two three,
 * four five six". The middle is written as a slash, so the singer feels the bar
 * in two from the page rather than counting it out. A bar of two or three beats
 * has no middle, and its beats close with the ordinary colon.
 */

/** The mark that closes one beat and opens the next. */
export const BEAT_MARK = ':';

/** The mark that divides a bar into its two halves. */
export const HALF_BAR_MARK = '/';

/** True when a bar of this many beats is read in two halves. */
export function dividesInHalves(beatCount: number): boolean {
    return beatCount > 2 && beatCount % 2 === 0;
}

/** The beat the bar's middle falls after, counting from one, or null. */
export function halfBarAfter(beatCount: number): number | null {
    return dividesInHalves(beatCount) ? beatCount / 2 : null;
}

/**
 * The mark that closes the beat at `beatIndex`, counting from zero, in a bar of
 * `beatCount` beats.
 */
export function markAfterBeat(beatIndex: number, beatCount: number): string {
    return halfBarAfter(beatCount) === beatIndex + 1 ? HALF_BAR_MARK : BEAT_MARK;
}
