import { addFractions, compareFractions, ZERO_FRACTION, type Fraction } from '@/domain/fraction';
import type { Measure } from '@/domain/measure';
import type { MusicalEvent } from '@/domain/musical-event';
import { PARTS } from '@/domain/parts';
import type { Score } from '@/domain/score';

function durationOfEvents(events: ReadonlyArray<MusicalEvent>): Fraction {
    return events.reduce<Fraction>(
        (total, event) => addFractions(total, event.duration),
        ZERO_FRACTION,
    );
}

function measureFits(measure: Measure): boolean {
    return (
        compareFractions(durationOfEvents(measure.events), measure.timeSignature.capacity()) <= 0
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
