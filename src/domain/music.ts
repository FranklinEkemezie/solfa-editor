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

const NOTE_VALUE_UNITS: Record<NoteValue, Fraction> = {
    [NoteValue.WHOLE]: fraction(4),
    [NoteValue.HALF]: fraction(2),
    [NoteValue.QUARTER]: fraction(1),
    [NoteValue.EIGHTH]: fraction(1, 2),
    [NoteValue.SIXTEENTH]: fraction(1, 4),
    [NoteValue.THIRTY_SECOND]: fraction(1, 8),
    [NoteValue.SIXTY_FOURTH]: fraction(1, 16),
};

export class Duration {
    public readonly noteValue: NoteValue;
    public readonly dots: number;

    public constructor(noteValue: NoteValue, dots = 0) {
        if (!Number.isInteger(dots) || dots < 0 || dots > 3) {
            throw new Error('A duration can have between zero and three dots.');
        }
        this.noteValue = noteValue;
        this.dots = dots;
    }

    public toQuarterUnits(): Fraction {
        const base = NOTE_VALUE_UNITS[this.noteValue];
        if (this.dots === 0) return base;
        return fraction(
            base.numerator * (2 ** (this.dots + 1) - 1),
            base.denominator * 2 ** this.dots,
        );
    }
}

export class KeySignature {
    public readonly accidental: Accidental;
    public readonly count: number;

    public constructor(accidental = Accidental.NATURAL, count = 0) {
        if (!Number.isInteger(count) || count < 0 || count > 7) {
            throw new Error('A key signature must contain between zero and seven accidentals.');
        }
        this.accidental = accidental;
        this.count = count;
    }
}

export class TimeSignature {
    public readonly note: NoteValue;
    public readonly count: number;

    public constructor(note = NoteValue.QUARTER, count = 4) {
        if (!Number.isInteger(count) || count < 1 || count > 32) {
            throw new Error('A time signature count must be between one and thirty-two.');
        }
        this.note = note;
        this.count = count;
    }

    public capacity(): Fraction {
        return fraction(
            NOTE_VALUE_UNITS[this.note].numerator * this.count,
            NOTE_VALUE_UNITS[this.note].denominator,
        );
    }
}

export class Key {
    public readonly letter: Letter;
    public readonly signature: KeySignature;
    public readonly mode: Mode;

    public constructor(letter = Letter.C, signature = new KeySignature(), mode = Mode.MAJOR) {
        this.letter = letter;
        this.signature = signature;
        this.mode = mode;
    }
}

export { Tempo } from './tempo';

export class Pitch {
    public readonly letter: Letter;
    public readonly accidental: Accidental;
    public readonly octave: number;

    public constructor(letter: Letter, accidental = Accidental.NATURAL, octave = 4) {
        this.letter = letter;
        this.accidental = accidental;
        this.octave = octave;
    }

    public toMidi(): number {
        const semitone: Record<Letter, number> = {
            [Letter.C]: 0,
            [Letter.D]: 2,
            [Letter.E]: 4,
            [Letter.F]: 5,
            [Letter.G]: 7,
            [Letter.A]: 9,
            [Letter.B]: 11,
        };
        const accidentalOffset: Record<Accidental, number> = {
            [Accidental.DOUBLE_FLAT]: -2,
            [Accidental.FLAT]: -1,
            [Accidental.NATURAL]: 0,
            [Accidental.SHARP]: 1,
            [Accidental.DOUBLE_SHARP]: 2,
        };
        return (this.octave + 1) * 12 + semitone[this.letter] + accidentalOffset[this.accidental];
    }
}

export abstract class MusicalEvent {
    public readonly duration: Duration;

    protected constructor(duration: Duration) {
        this.duration = duration;
    }
}

export class Note extends MusicalEvent {
    public readonly pitch: Pitch;
    public readonly syllable: SolfaSyllable;
    public readonly continuation: boolean;
    public readonly lyric: string;

    public constructor(
        pitch: Pitch,
        duration: Duration,
        syllable: SolfaSyllable,
        continuation = false,
        lyric = '',
    ) {
        super(duration);
        this.pitch = pitch;
        this.syllable = syllable;
        this.continuation = continuation;
        this.lyric = lyric;
    }
}

export class Tuplet extends MusicalEvent {
    public readonly notes: Note[];

    public constructor(notes: Note[], duration = new Duration(NoteValue.QUARTER)) {
        super(duration);
        this.notes = [...notes];
    }
}

export class Triplet extends Tuplet {
    public constructor(notes: [Note, Note, Note], duration?: Duration) {
        super(notes, duration);
    }
}

export class Quintuplet extends Tuplet {
    public constructor(notes: Note[], duration?: Duration) {
        super(notes, duration);
    }
}

export class Sextuplet extends Tuplet {
    public constructor(notes: [Note, Note, Note, Note, Note, Note], duration?: Duration) {
        super(notes, duration);
    }
}

export class Measure<T extends TimeSignature = TimeSignature> {
    public readonly timeSignature: T;
    public readonly events: MusicalEvent[];
    public readonly part: PartId;
    public readonly number: number;

    public constructor(
        timeSignature: T,
        events: MusicalEvent[] = [],
        part: PartId = 'soprano',
        number = 1,
    ) {
        this.timeSignature = timeSignature;
        this.events = [...events];
        this.part = part;
        this.number = number;
    }
}

export class Score {
    public readonly title: string;
    public readonly author: string;
    public readonly timeSignature: TimeSignature;
    public readonly key: Key;
    public readonly tempo: Tempo;
    public readonly measures: Measure[];
    public readonly lyrics: string;

    public constructor(
        title: string,
        timeSignature: TimeSignature,
        key: Key,
        tempo: Tempo,
        measures: Measure[],
        author = '',
        lyrics = '',
    ) {
        this.title = title;
        this.author = author;
        this.timeSignature = timeSignature;
        this.key = key;
        this.tempo = tempo;
        this.measures = [...measures];
        this.lyrics = lyrics;
    }
}

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
