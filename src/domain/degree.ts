/**
 * The seven degrees of the movable solfa scale.
 *
 * A note's primary identity is its degree, not the absolute letter it happens
 * to sound as in one key. The same `III` is E in C major and F♯ in D major.
 */
export enum Degree {
    I = 'I',
    II = 'II',
    III = 'III',
    IV = 'IV',
    V = 'V',
    VI = 'VI',
    VII = 'VII',
}

/** The degrees in scale order, used where an implementation needs to walk them. */
export const DEGREES: readonly Degree[] = [
    Degree.I,
    Degree.II,
    Degree.III,
    Degree.IV,
    Degree.V,
    Degree.VI,
    Degree.VII,
];
