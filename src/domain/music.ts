/**
 * The browser editor deliberately does not import anything from this file.
 * It is the small, serialisable music model at the centre of the application.
 */

export enum Letter {
    A = 'A',
    B = 'B',
    C = 'C',
    D = 'D',
    E = 'E',
    F = 'F',
    G = 'G',
}

export enum Accidental {
    DOUBLE_FLAT = 'DOUBLE_FLAT',
    FLAT = 'FLAT',
    NATURAL = 'NATURAL',
    SHARP = 'SHARP',
    DOUBLE_SHARP = 'DOUBLE_SHARP',
}

export enum Mode {
    MAJOR = 'MAJOR',
    MINOR = 'MINOR',
}

export enum NoteValue {
    WHOLE = 'WHOLE',
    HALF = 'HALF',
    QUARTER = 'QUARTER',
    EIGHTH = 'EIGHTH',
    SIXTEENTH = 'SIXTEENTH',
    THIRTY_SECOND = 'THIRTY_SECOND',
    SIXTY_FOURTH = 'SIXTY_FOURTH',
}

import { Tempo } from './tempo';

export type PartId = 'soprano' | 'alto' | 'tenor' | 'bass';

export const PARTS: ReadonlyArray<{ id: PartId; label: string; shortLabel: string }> = [
    { id: 'soprano', label: 'Soprano', shortLabel: 'S' },
    { id: 'alto', label: 'Alto', shortLabel: 'A' },
    { id: 'tenor', label: 'Tenor', shortLabel: 'T' },
    { id: 'bass', label: 'Bass', shortLabel: 'B' },
];

export const SOLFA_SYLLABLES = ['d', 'r', 'm', 'f', 's', 'l', 't'] as const;
export type SolfaSyllable = (typeof SOLFA_SYLLABLES)[number];

import type { MusicalEvent } from './musical-event';
import { Measure } from './measure';
import { Score } from './score';
import { TimeSignature } from './time-signature';
import { Key } from './key';
import { KeySignature } from './key-signature';
import { Pitch } from './pitch';

export type Fraction = Readonly<{ numerator: number; denominator: number }>;

function gcd(left: number, right: number): number {
    let a = Math.abs(left);
    let b = Math.abs(right);
    while (b !== 0) {
        const remainder = a % b;
        a = b;
        b = remainder;
    }
    return a || 1;
}

export function fraction(numerator: number, denominator = 1): Fraction {
    if (!Number.isInteger(numerator) || !Number.isInteger(denominator) || denominator === 0) {
        throw new Error('Fractions require an integer numerator and non-zero denominator.');
    }
    const sign = denominator < 0 ? -1 : 1;
    const divisor = gcd(numerator, denominator);
    return {
        numerator: (numerator / divisor) * sign,
        denominator: Math.abs(denominator / divisor),
    };
}

export function addFractions(left: Fraction, right: Fraction): Fraction {
    return fraction(
        left.numerator * right.denominator + right.numerator * left.denominator,
        left.denominator * right.denominator,
    );
}

export function compareFractions(left: Fraction, right: Fraction): number {
    return left.numerator * right.denominator - right.numerator * left.denominator;
}

export function fractionToNumber(value: Fraction): number {
    return value.numerator / value.denominator;
}

export const NOTE_VALUE_UNITS: Record<NoteValue, Fraction> = {
    [NoteValue.WHOLE]: fraction(4),
    [NoteValue.HALF]: fraction(2),
    [NoteValue.QUARTER]: fraction(1),
    [NoteValue.EIGHTH]: fraction(1, 2),
    [NoteValue.SIXTEENTH]: fraction(1, 4),
    [NoteValue.THIRTY_SECOND]: fraction(1, 8),
    [NoteValue.SIXTY_FOURTH]: fraction(1, 16),
};

export { Duration } from './duration';

export { KeySignature } from './key-signature';
export { TimeSignature } from './time-signature';
export { Key } from './key';

export { Tempo } from './tempo';

export { Pitch } from './pitch';
export { MusicalEvent } from './musical-event';
export { Note } from './note';
export { Tuplet, Triplet, Quintuplet, Sextuplet } from './tuplet';
export { Measure } from './measure';
export { Score } from './score';

export function durationOfEvents(events: ReadonlyArray<MusicalEvent>): Fraction {
    return events.reduce<Fraction>(
        (total, event) => addFractions(total, event.duration.toQuarterUnits()),
        fraction(0),
    );
}

export function measureFits(measure: Measure): boolean {
    return (
        compareFractions(durationOfEvents(measure.events), measure.timeSignature.capacity()) <= 0
    );
}

export function measureIsFull(measure: Measure): boolean {
    return (
        compareFractions(durationOfEvents(measure.events), measure.timeSignature.capacity()) === 0
    );
}

export function validateScore(score: Score): string[] {
    const errors: string[] = [];
    if (score.measures.length === 0) errors.push('A score must contain at least one measure.');
    for (const part of PARTS) {
        const measures = score.measures.filter((measure) => measure.part === part.id);
        if (measures.length === 0) errors.push(`${part.label} has no measures.`);
        for (const measure of measures) {
            if (!measureFits(measure)) {
                errors.push(`${part.label} measure ${measure.number} exceeds its time signature.`);
            }
        }
    }
    return errors;
}

export const SOLFA_TO_PITCH: Record<SolfaSyllable, Pitch> = {
    d: new Pitch(Letter.C, Accidental.NATURAL, 4),
    r: new Pitch(Letter.D, Accidental.NATURAL, 4),
    m: new Pitch(Letter.E, Accidental.NATURAL, 4),
    f: new Pitch(Letter.F, Accidental.NATURAL, 4),
    s: new Pitch(Letter.G, Accidental.NATURAL, 4),
    l: new Pitch(Letter.A, Accidental.NATURAL, 4),
    t: new Pitch(Letter.B, Accidental.NATURAL, 4),
};

export const DEFAULT_TIME_SIGNATURE = new TimeSignature(NoteValue.QUARTER, 4);

export function createEmptyScore(): Score {
    const measures: Measure[] = [];
    for (const part of PARTS) {
        for (let number = 1; number <= 2; number += 1) {
            measures.push(new Measure(DEFAULT_TIME_SIGNATURE, [], part.id, number));
        }
    }
    return new Score(
        'Untitled solfa',
        DEFAULT_TIME_SIGNATURE,
        new Key(Letter.C, new KeySignature(Accidental.NATURAL, 0), Mode.MAJOR),
        new Tempo(NoteValue.QUARTER, 100, 'Andante'),
        measures,
        'Composer',
    );
}

export function timeSignatureLabel(signature: TimeSignature): string {
    const value = NOTE_VALUE_UNITS[signature.note];
    const denominator = (value.denominator * 4) / value.numerator;
    return `${signature.count}/${denominator}`;
}

export function noteValueLabel(value: NoteValue): string {
    return value.replaceAll('_', ' ').toLowerCase();
}
