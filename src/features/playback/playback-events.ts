import * as Tone from 'tone';
import {
    NOTE_VALUE_UNITS,
    PARTS,
    SOLFA_TO_PITCH,
    type NoteValue,
    type PartId,
    type SolfaSyllable,
} from '@/domain/music';
import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';

export type PlaybackEvent = {
    /** Seconds from the start of the score. */
    time: number;
    note: string;
    /** How long the note sounds, in seconds. */
    durationSeconds: number;
    syllable: SolfaSyllable;
    part: PartId;
    slotId: string;
};

export type PlaybackCallbacks = {
    onNoteStart?: (event: PlaybackEvent) => void;
    onPlaybackEnded?: () => void;
};

/**
 * How far each part is transposed from the written pitch.
 *
 * The score is written in a single register, so the parts are separated by
 * whole octaves: soprano an octave above the written pitch, alto at it, and the
 * men's parts one and two octaves below it.
 */
const PART_OCTAVE_OFFSETS: Record<PartId, number> = {
    soprano: 12,
    alto: 0,
    tenor: -12,
    bass: -24,
};

function quarterUnits(value: NoteValue): number {
    const units = NOTE_VALUE_UNITS[value];
    return units ? units.numerator / units.denominator : 1;
}

/** Seconds per quarter note at the score's tempo. */
export function secondsPerQuarter(document: EditorDocument): number {
    const beatQuarters = quarterUnits(document.tempo.beatUnit);
    if (beatQuarters <= 0) return 60 / document.tempo.beatsPerMinute;
    return 60 / document.tempo.beatsPerMinute / beatQuarters;
}

/**
 * Flatten the score into a single time-ordered list of notes.
 *
 * Every duration is converted once, into quarter notes, and then into seconds,
 * so a note's length never depends on how the notation happens to spell it. A
 * continuation prolongs the note before it instead of sounding again.
 */
export function buildPlaybackEvents(document: EditorDocument): PlaybackEvent[] {
    const measureNumbers = [...new Set(document.measures.map((measure) => measure.number))].sort(
        (left, right) => left - right,
    );
    const secondsPer = secondsPerQuarter(document);

    const events: PlaybackEvent[] = [];
    const lastByPart = new Map<PartId, PlaybackEvent>();
    let clockQuarters = 0;

    for (const measureNumber of measureNumbers) {
        for (const part of PARTS) {
            const measure = document.measures.find(
                (candidate) => candidate.part === part.id && candidate.number === measureNumber,
            );
            if (!measure) continue;

            let beatQuarters = 0;
            for (const slot of measure.slots) {
                const slotQuarters = quarterUnits(slot.noteValue);
                const noteQuarters = slotQuarters / slot.division;
                const noteSeconds = Math.max(noteQuarters * secondsPer, 0.02);

                slot.notes.forEach((note, index) => {
                    if (!note.syllable) return;

                    const previous = lastByPart.get(part.id);
                    if (note.continuation && previous) {
                        previous.durationSeconds += noteSeconds;
                        return;
                    }

                    const midi =
                        SOLFA_TO_PITCH[note.syllable].toMidi() + PART_OCTAVE_OFFSETS[part.id];
                    const event: PlaybackEvent = {
                        time: (clockQuarters + beatQuarters + index * noteQuarters) * secondsPer,
                        note: Tone.Frequency(midi, 'midi').toNote(),
                        durationSeconds: noteSeconds,
                        syllable: note.syllable,
                        part: part.id,
                        slotId: slot.id,
                    };
                    events.push(event);
                    lastByPart.set(part.id, event);
                });

                beatQuarters += slotQuarters;
            }
        }

        clockQuarters +=
            document.timeSignature.count * quarterUnits(document.timeSignature.note);
    }

    return events.sort((left, right) => left.time - right.time);
}
