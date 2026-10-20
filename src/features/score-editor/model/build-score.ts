import {
    addFractions,
    ceilFraction,
    compareFractions,
    divideFractions,
    fraction,
    isZeroFraction,
    Measure,
    multiplyFractions,
    NOTE_VALUE_UNITS,
    Note,
    PARTS,
    Rest,
    Score,
    subtractFractions,
    TimeSignature,
    VOICE_SETTINGS,
    ZERO_FRACTION,
    type Fraction,
    type MusicalEvent,
    type PartId,
    type ScoreDocument,
} from '@/domain/music';
import type { NotationEvent, VoiceNotation } from '@/features/notation/musical-ir';
import { parseVoice } from '@/features/notation/notation-engine';
import type {
    BeatItemView,
    BeatView,
    MeasureView,
    PartView,
    ScoreDiagnostic,
    ScoreView,
} from '@/features/score-editor/model/score-view';

function eventEnd(event: NotationEvent): Fraction {
    return addFractions(
        event.start,
        event.kind === 'note' ? event.note.duration : event.rest.duration,
    );
}

function voiceEnd(voice: VoiceNotation): Fraction {
    const last = voice.events[voice.events.length - 1];
    return last ? eventEnd(last) : ZERO_FRACTION;
}

/** The first moment of a one-based measure number. */
function measureStart(number: number, capacity: Fraction): Fraction {
    return multiplyFractions(capacity, fraction(number - 1));
}

/**
 * Cut a voice's events to one measure.
 *
 * A note that crosses the barline is divided into tied segments rather than
 * truncated, so the measure contains exactly the music that sounds in it and
 * the next measure begins with the continuation.
 */
function eventsInMeasure(voice: VoiceNotation, start: Fraction, end: Fraction): MusicalEvent[] {
    const events: MusicalEvent[] = [];

    for (const event of voice.events) {
        const finish = eventEnd(event);
        if (compareFractions(finish, start) <= 0) continue;
        if (compareFractions(event.start, end) >= 0) break;

        const overlapStart = compareFractions(event.start, start) < 0 ? start : event.start;
        const overlapEnd = compareFractions(finish, end) > 0 ? end : finish;
        const duration = subtractFractions(overlapEnd, overlapStart);
        if (isZeroFraction(duration)) continue;

        const continues = compareFractions(event.start, start) < 0;
        if (event.kind === 'note') {
            events.push(
                new Note(
                    event.note.pitch,
                    duration,
                    event.note.syllable,
                    continues,
                    event.note.lyric,
                ),
            );
        } else {
            events.push(new Rest(duration));
        }
    }

    return events;
}

/** The caret offset that belongs to a moment: the end of the event sounding there. */
function sourceOffsetAt(voice: VoiceNotation, time: Fraction, fallback: number): number {
    if (compareFractions(voiceEnd(voice), time) <= 0) return fallback;

    for (const event of voice.events) {
        if (compareFractions(event.start, time) > 0) break;
        if (compareFractions(eventEnd(event), time) > 0) return event.sourceEnd;
    }

    return fallback;
}

function divisionFor(items: readonly BeatItemView[]): 1 | 2 | 4 {
    if (items.length <= 1) return 1;
    // A held note and a new one in the same beat are two events, not a divided
    // beat, so they are set apart by space rather than by a subdivision mark.
    if (items.some((item) => item.kind === 'continuation')) return 1;
    return items.length === 2 ? 2 : 4;
}

function measureView(
    part: PartId,
    voice: VoiceNotation,
    number: number,
    start: Fraction,
    timeSignature: TimeSignature,
): MeasureView {
    const beatUnit = NOTE_VALUE_UNITS[timeSignature.note];
    const beats: BeatView[] = [];

    for (let index = 0; index < timeSignature.count; index += 1) {
        const beatStart = addFractions(start, multiplyFractions(beatUnit, fraction(index)));
        const beatEnd = addFractions(beatStart, beatUnit);
        const items: BeatItemView[] = [];

        for (let eventIndex = 0; eventIndex < voice.events.length; eventIndex += 1) {
            const event = voice.events[eventIndex];
            if (event.kind !== 'note') continue;
            if (compareFractions(eventEnd(event), beatStart) <= 0) continue;
            if (compareFractions(event.start, beatEnd) >= 0) break;

            const startsHere = compareFractions(event.start, beatStart) >= 0;
            items.push({
                kind: startsHere ? 'note' : 'continuation',
                noteKey: `${part}:${eventIndex}`,
                syllable: event.note.syllable,
                accidental: event.accidentalModifier,
                octaveOffset: event.octaveOffset,
                lyric: event.note.lyric,
            });
        }

        beats.push({
            number: index + 1,
            division: divisionFor(items),
            items,
            sourceOffset: sourceOffsetAt(voice, beatStart, voice.source.length),
        });
    }

    return { number, beats };
}

function silentMeasureView(number: number, beatCount: number): MeasureView {
    return {
        number,
        beats: Array.from({ length: beatCount }, (_, index) => ({
            number: index + 1,
            division: 1,
            items: [],
            sourceOffset: 0,
        })),
    };
}

type ParsedPart = {
    part: PartId;
    voice: VoiceNotation | null;
    diagnostics: ScoreDiagnostic[];
};

/**
 * Build the score and its page view from the document's sources.
 *
 * This is the only place measures are inferred. It parses each voice, finds the
 * longest one, and lays every voice over the same number of measures so the
 * four parts stay aligned. A voice that does not parse contributes its
 * diagnostics and no measures; the rest of the score is still shown.
 */
export function buildScoreView(document: ScoreDocument): ScoreView {
    const capacity = document.timeSignature.capacity();
    const signature = new TimeSignature(
        document.timeSignature.note,
        document.timeSignature.count,
    );
    const parsed: ParsedPart[] = [];
    let derivedCount = 1;

    for (const part of PARTS) {
        const source = document.voices[part.id];
        const result = parseVoice(source, VOICE_SETTINGS[part.id]);

        if (!result.ok) {
            parsed.push({
                part: part.id,
                voice: null,
                diagnostics: result.diagnostics.map((diagnostic) => ({
                    ...diagnostic,
                    part: part.id,
                })),
            });
            continue;
        }

        const end = voiceEnd(result.notation);
        if (!isZeroFraction(end)) {
            derivedCount = Math.max(derivedCount, ceilFraction(divideFractions(end, capacity)));
        }
        parsed.push({ part: part.id, voice: result.notation, diagnostics: [] });
    }

    const measureCount = Math.max(1, document.measureCount, derivedCount);
    const scoreMeasures: Measure[] = [];
    const parts = {} as Record<PartId, PartView>;

    for (const entry of parsed) {
        const definition = PARTS.find((part) => part.id === entry.part);
        const measures: MeasureView[] = [];

        for (let number = 1; number <= measureCount; number += 1) {
            const start = measureStart(number, capacity);
            const end = addFractions(start, capacity);
            const events = entry.voice ? eventsInMeasure(entry.voice, start, end) : [];
            scoreMeasures.push(new Measure(signature, events, entry.part, number));

            measures.push(
                entry.voice
                    ? measureView(entry.part, entry.voice, number, start, signature)
                    : silentMeasureView(number, signature.count),
            );
        }

        parts[entry.part] = {
            id: entry.part,
            label: definition?.label ?? entry.part,
            shortLabel: definition?.shortLabel ?? '',
            source: document.voices[entry.part],
            voice: entry.voice,
            measures,
            diagnostics: entry.diagnostics,
        };
    }

    const score = new Score(
        document.title,
        document.timeSignature,
        document.key,
        document.tempo,
        scoreMeasures,
        document.author,
        document.lyrics,
        document.subtitle,
    );

    return {
        document,
        score,
        parts,
        measureNumbers: Array.from({ length: measureCount }, (_, index) => index + 1),
        measureCount,
        diagnostics: parsed.flatMap((entry) => entry.diagnostics),
    };
}
