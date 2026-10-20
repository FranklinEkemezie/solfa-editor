import {
    fractionsEqual,
    fraction,
    Measure,
    Note,
    NoteValue,
    NOTE_VALUE_UNITS,
    PARTS,
    Score,
    type BeatDivision,
    type Fraction,
    type MusicalEvent,
    type SolfaSyllable,
} from '@/domain/music';
import type {
    EditorDocument,
    EditorMeasure,
} from '@/features/score-editor/adapters/editor-document-schema';
import { emptyMeasure } from '@/features/score-editor/adapters/editor-factories';
import { createNoteId } from '@/features/score-editor/state/note-id';

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
        type: 'sol-fa-document',
        title: score.title,
        subtitle: score.subtitle,
        author: score.author,
        timeSignature: score.timeSignature,
        key: score.key,
        tempo: score.tempo,
        lyrics: score.lyrics,
        measures,
    };
}

type NoteGroup = { division: BeatDivision; notes: Note[] };

/**
 * The old editor stored a beat's division rather than a duration. This adapter
 * is on its way out; until it goes, read the division back off an exact
 * duration so a converted score still groups into its original beats.
 */
function divisionForDuration(beatValue: NoteValue, duration: Fraction): BeatDivision {
    const beat = NOTE_VALUE_UNITS[beatValue];
    if (fractionsEqual(duration, beat)) return 1;
    if (fractionsEqual(duration, fraction(beat.numerator, beat.denominator * 2))) return 2;
    return 4;
}

/**
 * Group a measure's events into beats.
 *
 * Consecutive notes shorter than the beat and of the same written value are
 * gathered into one divided beat, which is how a score that was saved with
 * subdivisions reads back as `d.m` rather than as two separate beats.
 */
function groupEventsIntoBeats(
    events: ReadonlyArray<MusicalEvent>,
    beatValue: NoteValue,
): NoteGroup[] {
    const groups: NoteGroup[] = [];
    let index = 0;

    while (index < events.length) {
        const event = events[index];
        if (!(event instanceof Note)) {
            index += 1;
            continue;
        }

        const division = divisionForDuration(beatValue, event.duration);
        const notes: Note[] = [event];
        let next = index + 1;
        while (notes.length < division && next < events.length) {
            const candidate = events[next];
            if (!(candidate instanceof Note)) break;
            if (divisionForDuration(beatValue, candidate.duration) !== division) break;
            notes.push(candidate);
            next += 1;
        }

        groups.push({ division, notes });
        index = next;
    }

    return groups;
}

function toEditorMeasure(measure: Measure): EditorMeasure {
    const base = emptyMeasure(measure.part, measure.number, measure.timeSignature);
    const groups = groupEventsIntoBeats(measure.events, measure.timeSignature.note);

    return {
        ...base,
        slots: base.slots.map((slot, index) => {
            const group = groups[index];
            if (!group) return slot;
            return {
                ...slot,
                division: group.division,
                notes: group.notes.map((note) => ({
                    id: createNoteId(slot.id),
                    syllable: note.syllable as SolfaSyllable,
                    continuation: note.continuation,
                    lyric: note.lyric,
                })),
            };
        }),
    };
}
