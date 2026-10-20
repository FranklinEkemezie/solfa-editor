import { describe, expect, it } from 'vitest';
import {
    Accidental,
    Degree,
    fraction,
    NOTE_VALUE_UNITS,
    Note,
    Rest,
    type Fraction,
} from '@/domain/music';
import type { VoiceSettings } from '@/domain/voice';
import { parseVoice } from '@/features/notation/notation-engine';
import type { NotationEvent, NotationNote } from '@/features/notation/musical-ir';

const NEUTRAL: VoiceSettings = { referenceOctave: 4 };

function notation(source: string, settings: VoiceSettings = NEUTRAL) {
    const result = parseVoice(source, settings);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.diagnostics[0]?.message ?? 'parse failed');
    return result.notation;
}

function noteAt(source: string, index = 0, settings: VoiceSettings = NEUTRAL): NotationNote {
    const event = notation(source, settings).events[index];
    if (!event || event.kind !== 'note') throw new Error(`Event ${index} is not a note.`);
    return event;
}

function eventShape(event: NotationEvent): string {
    return event.kind === 'note' ? event.note.syllable : 'rest';
}

function duration(event: NotationEvent): Fraction {
    return event.kind === 'note' ? event.note.duration : event.rest.duration;
}

describe('the notation engine', () => {
    it('reads the empty voice', () => {
        const voice = notation('');
        expect(voice.events).toEqual([]);
        expect(voice.duration).toBeNull();
    });

    it('builds a note with its degree, octave, duration and source', () => {
        const voice = notation(':d');
        expect(voice.events).toHaveLength(1);
        const note = noteAt(':d');
        expect(note.note).toBeInstanceOf(Note);
        expect(note.note.pitch).toMatchObject({
            degree: Degree.I,
            accidental: Accidental.NATURAL,
            octave: 4,
        });
        expect(note.note.duration).toEqual(fraction(1));
        expect(note.start).toEqual(fraction(0));
        expect(note.source).toEqual({ start: 1, end: 2 });
        expect(voice.duration).toBe('QUARTER');
    });

    it('uses each voice’s reference octave', () => {
        expect(noteAt(':d', 0, { referenceOctave: 5 }).note.pitch.octave).toBe(5);
        expect(noteAt(':d', 0, { referenceOctave: 2 }).note.pitch.octave).toBe(2);
    });

    it('takes the most recent duration for the notes that follow it', () => {
        expect(noteAt(':.d').note.duration).toEqual(fraction(1, 2));
        expect(noteAt(',d').note.duration).toEqual(fraction(1, 4));
    });

    it('lays consecutive notes out in exact time', () => {
        const voice = notation(':drs');
        expect(voice.events.map(eventShape)).toEqual(['d', 'r', 's']);
        expect(voice.events.map((event) => event.start)).toEqual([
            fraction(0),
            fraction(1),
            fraction(2),
        ]);
        expect(voice.events.map(duration)).toEqual([fraction(1), fraction(1), fraction(1)]);
    });

    it('lengthens a note by one current duration for each continuation', () => {
        const voice = notation(':d--');
        expect(voice.events).toHaveLength(1);
        expect(noteAt(':d--').note.duration).toEqual(fraction(3));
        expect(noteAt(':d--').continuationSources).toEqual([
            { start: 2, end: 3 },
            { start: 3, end: 4 },
        ]);
    });

    it('uses a duration changed after the note for its continuation', () => {
        expect(noteAt(':d.-').note.duration).toEqual(fraction(3, 2));
        expect(noteAt(':d-.-').note.duration).toEqual(fraction(5, 2));
        expect(noteAt(':d.,-').note.duration).toEqual(fraction(5, 4));
    });

    it('keeps time moving through continuations', () => {
        const voice = notation(':d-r');
        expect(voice.events.map((event) => event.start)).toEqual([fraction(0), fraction(2)]);
        expect(voice.events.map(duration)).toEqual([fraction(2), fraction(1)]);
    });

    it('resolves the latest octave modifier as the absolute offset', () => {
        expect(noteAt(":d'").note.pitch.octave).toBe(5);
        expect(noteAt(':d1').note.pitch.octave).toBe(3);
        expect(noteAt(":d''1").note.pitch.octave).toBe(3);
        expect(noteAt(":d''1").octaveOffset).toBe(-1);
    });

    it('lets an explicit accidental override the syllable’s own alteration', () => {
        const raised = noteAt(':de');
        expect(raised.note.pitch).toMatchObject({
            degree: Degree.I,
            accidental: Accidental.SHARP,
        });
        expect(raised.accidentalModifier).toBeNull();

        const explicit = noteAt(':d#');
        expect(explicit.note.pitch.accidental).toBe(Accidental.SHARP);
        expect(explicit.accidentalModifier).toBe(Accidental.SHARP);

        const lowered = noteAt(':deb');
        expect(lowered.note.pitch.accidental).toBe(Accidental.FLAT);
        expect(lowered.accidentalModifier).toBe(Accidental.FLAT);

        const twice = noteAt(':d#b');
        expect(twice.note.pitch.accidental).toBe(Accidental.FLAT);
    });

    it('keeps every chromatic syllable’s degree', () => {
        expect(noteAt(':de').note.pitch.degree).toBe(Degree.I);
        expect(noteAt(':re').note.pitch.degree).toBe(Degree.II);
        expect(noteAt(':ma').note.pitch.degree).toBe(Degree.III);
        expect(noteAt(':fe').note.pitch.degree).toBe(Degree.IV);
        expect(noteAt(':ba').note.pitch.degree).toBe(Degree.V);
        expect(noteAt(':se').note.pitch.degree).toBe(Degree.V);
        expect(noteAt(':ta').note.pitch.degree).toBe(Degree.VII);
    });

    it('reads rests at the current duration', () => {
        const voice = notation(':.d ');
        expect(voice.events.map(eventShape)).toEqual(['d', 'rest']);
        expect(voice.events.map(duration)).toEqual([fraction(1, 2), fraction(1, 2)]);
        expect(voice.events[1]?.start).toEqual(fraction(1, 2));
        const rest = voice.events[1];
        expect(rest?.kind === 'rest' ? rest.rest : null).toBeInstanceOf(Rest);
    });

    it('records every duration change with its source range', () => {
        const voice = notation(':.d,');
        expect(voice.durationChanges).toEqual([
            { value: 'QUARTER', range: { start: 0, end: 1 } },
            { value: 'EIGHTH', range: { start: 1, end: 2 } },
            { value: 'SIXTEENTH', range: { start: 3, end: 4 } },
        ]);
        expect(voice.duration).toBe('SIXTEENTH');
    });

    it('keeps the chosen token stream beside the events', () => {
        expect(notation(':d').tokens.map((token) => token.kind)).toEqual(['duration', 'pitch']);
    });

    it('can hold a duration that is not a single note value', () => {
        expect(noteAt(':d.-').note.duration).toEqual(fraction(3, 2));
        expect(noteAt(':d.,-').note.duration).toEqual(fraction(5, 4));
        expect(NOTE_VALUE_UNITS.QUARTER).toEqual(fraction(1));
    });

    it('reports a source it cannot read instead of inventing events', () => {
        const result = parseVoice(':d x', NEUTRAL);
        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.diagnostics).toHaveLength(1);
        expect(result.diagnostics[0]?.range).toEqual({ start: 3, end: 4 });
    });
});
