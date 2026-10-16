import {
    Duration,
    Measure,
    Note,
    NoteValue,
    PARTS,
    Score,
    type SolfaSyllable,
} from '@/domain/music';
import type { EditorDocument, EditorMeasure, EditorSlot } from './editor-document-schema';

const BEATS_PER_MEASURE_LIMIT = 32;

export function domainToEditor(score: Score): EditorDocument {
    const measures: EditorMeasure[] = [];
    for (const part of PARTS) {
        const partMeasures = score.measures
            .filter((measure) => measure.part === part.id)
            .sort((left, right) => left.number - right.number);
        for (const measure of partMeasures) {
            measures.push(toEditorMeasure(measure));
        }
    }
    return {
        type: 'solfa-document',
        title: score.title,
        author: score.author,
        timeSignature: score.timeSignature,
        key: score.key,
        tempo: score.tempo,
        lyrics: score.lyrics,
        measures,
    };
}

function toEditorMeasure(measure: Measure): EditorMeasure {
    const defaultSlotCount = Math.min(measure.timeSignature.count, BEATS_PER_MEASURE_LIMIT);
    const slots: EditorSlot[] = Array.from({ length: defaultSlotCount }, (_, index) => ({
        id: `${measure.part}-${measure.number}-${index}`,
        noteValue: NoteValue.QUARTER,
    }));

    let slotIndex = 0;
    for (const event of measure.events) {
        if (!(event instanceof Note)) continue;
        const target = slots[slotIndex];
        if (!target) break;
        target.syllable = event.syllable as SolfaSyllable;
        target.continuation = event.continuation;
        target.noteValue = event.duration.noteValue;
        target.lyric = event.lyric;
        const slotSpan = Math.max(
            1,
            Math.round(new Duration(event.duration.noteValue).toQuarterUnits().denominator),
        );
        slotIndex += slotSpan;
    }

    return {
        id: `${measure.part}-${measure.number}`,
        part: measure.part,
        number: measure.number,
        timeSignature: measure.timeSignature,
        slots,
    };
}
