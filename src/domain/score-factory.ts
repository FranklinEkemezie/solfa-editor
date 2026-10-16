import { Accidental } from '@/domain/accidental';
import { Key } from '@/domain/key';
import { KeySignature } from '@/domain/key-signature';
import { Letter } from '@/domain/letter';
import { Measure } from '@/domain/measure';
import { Mode } from '@/domain/mode';
import { NoteValue } from '@/domain/note-value';
import { PARTS } from '@/domain/parts';
import { Score } from '@/domain/score';
import { Tempo } from '@/domain/tempo';
import { TimeSignature } from '@/domain/time-signature';

const DEFAULT_TIME_SIGNATURE = new TimeSignature(NoteValue.QUARTER, 4);
const DEFAULT_MEASURE_COUNT = 2;

export function createEmptyScore(): Score {
    const measures: Measure[] = [];
    for (const part of PARTS) {
        for (let number = 1; number <= DEFAULT_MEASURE_COUNT; number += 1) {
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
