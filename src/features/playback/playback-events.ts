import * as Tone from 'tone';
import {
    PARTS,
    SOLFA_TO_PITCH,
    type NoteValue,
    type PartId,
    type SolfaSyllable,
} from '@/domain/music';
import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';

export type PlaybackEvent = {
    time: number;
    note: string;
    duration: string;
    syllable: SolfaSyllable;
    part: PartId;
    slotId: string;
};

export type PlaybackCallbacks = {
    onNoteStart?: (event: PlaybackEvent) => void;
    onPlaybackEnded?: () => void;
};

const PART_OCTAVE_OFFSETS: Record<PartId, number> = {
    soprano: 12,
    alto: 7,
    tenor: -12,
    bass: -24,
};

const QUARTER_UNITS: Record<NoteValue, number> = {
    WHOLE: 4,
    HALF: 2,
    QUARTER: 1,
    EIGHTH: 0.5,
    SIXTEENTH: 0.25,
    THIRTY_SECOND: 0.125,
    SIXTY_FOURTH: 0.0625,
};

function noteValueToQuarterUnits(value: NoteValue): number {
    return QUARTER_UNITS[value] ?? 1;
}

function getBeatSeconds(document: EditorDocument): number {
    const beatUnit = noteValueToQuarterUnits(document.tempo.beatUnit);
    const measureUnit = noteValueToQuarterUnits(document.timeSignature.note);
    if (beatUnit <= 0) return 60 / document.tempo.beatsPerMinute;
    return (measureUnit / beatUnit) * (60 / document.tempo.beatsPerMinute);
}

export function buildPlaybackEvents(document: EditorDocument): PlaybackEvent[] {
    const measureNumbers = [...new Set(document.measures.map((measure) => measure.number))].sort(
        (left, right) => left - right,
    );

    const events: PlaybackEvent[] = [];
    const beatSeconds = getBeatSeconds(document);
    let clock = 0;

    for (const measureNumber of measureNumbers) {
        for (const part of PARTS) {
            const measure = document.measures.find(
                (candidate) => candidate.part === part.id && candidate.number === measureNumber,
            );
            if (!measure) continue;

            let slotOffset = 0;
            for (const slot of measure.slots) {
                if (!slot.syllable) {
                    slotOffset += noteValueToQuarterUnits(slot.noteValue);
                    continue;
                }

                const midi = SOLFA_TO_PITCH[slot.syllable].toMidi() + PART_OCTAVE_OFFSETS[part.id];
                const durationBeats =
                    noteValueToQuarterUnits(slot.noteValue) /
                    noteValueToQuarterUnits(document.tempo.beatUnit);

                events.push({
                    time: clock + slotOffset * beatSeconds,
                    note: Tone.Frequency(midi, 'midi').toNote(),
                    duration: `${Math.max(durationBeats, 0.125)}n`,
                    syllable: slot.syllable,
                    part: part.id,
                    slotId: slot.id,
                });

                slotOffset += noteValueToQuarterUnits(slot.noteValue);
            }
        }

        const measureDuration =
            (document.timeSignature.count * noteValueToQuarterUnits(document.timeSignature.note)) /
            noteValueToQuarterUnits(document.tempo.beatUnit);
        clock += measureDuration * beatSeconds;
    }

    return events.sort((left, right) => left.time - right.time);
}
