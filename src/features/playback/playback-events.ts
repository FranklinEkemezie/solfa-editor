import * as Tone from 'tone';
import {
    fractionToNumber,
    NOTE_VALUE_UNITS,
    PARTS,
    soundingMidi,
    type NoteValue,
    type PartId,
    type ScoreDocument,
    type SolfaSyllable,
} from '@/domain/music';
import type { ScoreView } from '@/features/score-editor/model/score-view';

export type PlaybackEvent = {
    /** Seconds from the start of the score. */
    time: number;
    note: string;
    /** How long the note sounds, in seconds. */
    durationSeconds: number;
    syllable: SolfaSyllable;
    part: PartId;
    /** The same identity the page uses to mark the note being played. */
    noteKey: string;
};

export type PlaybackCallbacks = {
    onNoteStart?: (event: PlaybackEvent) => void;
    onPlaybackEnded?: () => void;
};

function quarterUnits(value: NoteValue): number {
    const units = NOTE_VALUE_UNITS[value];
    return units ? units.numerator / units.denominator : 1;
}

/** Seconds per quarter note at the score's tempo. */
export function secondsPerQuarter(document: Pick<ScoreDocument, 'tempo'>): number {
    const beatQuarters = quarterUnits(document.tempo.beatUnit);
    if (beatQuarters <= 0) return 60 / document.tempo.beatsPerMinute;
    return 60 / document.tempo.beatsPerMinute / beatQuarters;
}

/**
 * Flatten the score into a single time-ordered list of notes.
 *
 * The source language already carries exact quarter-note starts and lengths,
 * so playback reads those rather than rebuilding a clock from the page. A held
 * note is one event of its full written length — the page may split it at a
 * barline, but the ear should not hear a barline at all.
 *
 * The key is applied here, to the pitch only: the syllables stay written as
 * they read, and the transposition never touches the score.
 */
export function buildPlaybackEvents(view: ScoreView): PlaybackEvent[] {
    const secondsPer = secondsPerQuarter(view.document);
    const events: PlaybackEvent[] = [];

    for (const part of PARTS) {
        const voice = view.parts[part.id].voice;
        if (!voice) continue;

        voice.events.forEach((event, index) => {
            if (event.kind !== 'note') return;

            const midi = soundingMidi(event.note.pitch, view.document.key);
            events.push({
                time: fractionToNumber(event.start) * secondsPer,
                note: Tone.Frequency(midi, 'midi').toNote(),
                durationSeconds: fractionToNumber(event.note.duration) * secondsPer,
                syllable: event.note.syllable,
                part: part.id,
                noteKey: `${part.id}:${index}`,
            });
        });
    }

    return events.sort((left, right) => left.time - right.time);
}
