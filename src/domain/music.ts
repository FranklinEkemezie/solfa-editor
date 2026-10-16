/**
 * music.ts — domain utility functions and convenience factory.
 *
 * All primitive enum and entity types live in their own files.
 * This module imports those and provides higher-level helpers
 * (score validation, label formatting, factory functions) that
 * sit on top of the domain entities.
 *
 * The browser editor does not import from this file directly;
 * it uses the domain barrel at src/domain/index.ts instead.
 */

export { Letter } from './letter';
export { Accidental } from './accidental';
export { Mode } from './mode';
export { NoteValue, NOTE_VALUE_UNITS } from './note-value';
export { type PartId, PARTS } from './parts';
export { type SolfaSyllable, SOLFA_SYLLABLES, SOLFA_TO_PITCH } from './solfa';
export { type Fraction, fraction, addFractions, compareFractions, fractionToNumber } from './fraction';

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

import type { Fraction } from './fraction';
import { addFractions, compareFractions, fraction } from './fraction';
import { NoteValue, NOTE_VALUE_UNITS } from './note-value';
import { PARTS } from './parts';
import { Letter } from './letter';
import { Accidental } from './accidental';
import { Mode } from './mode';
import { KeySignature } from './key-signature';
import { Key } from './key';
import { TimeSignature } from './time-signature';
import { Tempo } from './tempo';
import { Pitch } from './pitch';
import type { MusicalEvent } from './musical-event';
import { Measure } from './measure';
import { Score } from './score';

// ---------------------------------------------------------------------------
// Aggregate helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Defaults and factory
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Label helpers
// ---------------------------------------------------------------------------

export function timeSignatureLabel(signature: TimeSignature): string {
    const value = NOTE_VALUE_UNITS[signature.note];
    const denominator = (value.denominator * 4) / value.numerator;
    return `${signature.count}/${denominator}`;
}

export function noteValueLabel(value: NoteValue): string {
    return value.replaceAll('_', ' ').toLowerCase();
}
