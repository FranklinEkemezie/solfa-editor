/**
 * The drawn key that should light up when a key is pressed.
 *
 * Both keyboards write the same notation, but three physical keys have no
 * drawn key of the same name: Space writes a rest, `'` raises the register and
 * a digit lowers it. Every other key is drawn under the name it was pressed
 * with, so a letter lights its own syllable.
 */
export function echoTarget(key: string): string {
    if (key === ' ') return 'rest';
    if (key === "'") return 'octave-up';
    if (/^[1-9]$/.test(key)) return 'octave-down';
    return key;
}
