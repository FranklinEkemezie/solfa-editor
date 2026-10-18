import {
    CHROMATIC_SOLFA_SYLLABLES,
    type BeatDivision,
    NATURAL_SOLFA_SYLLABLES,
    NoteValue,
    PARTS,
    type PartId,
    type SolfaSyllable,
    Tempo,
    TimeSignature,
} from '@/domain/music';
import type {
    EditorDocument,
    EditorMeasure,
    EditorNote,
    EditorSlot,
} from '@/features/score-editor/adapters/editor-document-schema';
import { emptyMeasure } from '@/features/score-editor/adapters/editor-factories';
import {
    keyFromOptionValue,
    timeSignatureFromOptionValue,
} from '@/features/score-editor/adapters/metadata-options';
import { createNoteId } from '@/features/score-editor/state/note-id';

/**
 * A sample score written as tonic sol-fa text.
 *
 * The notation is the same one the editor writes back out, so a preset reads
 * the way the score will:
 *
 * | Written        | Means                                              |
 * | -------------- | -------------------------------------------------- |
 * | `d r m f s l t`| the diatonic syllables                             |
 * | `de re ma fe ba se ta` | the chromatic syllables                     |
 * | `.`            | halves the beat   (`m.d` is two notes in a beat)   |
 * | `,`            | quarters the beat (`d,r.m,f` is four in a beat)    |
 * | `-`            | sustains the note before it                        |
 * | `:`            | the next beat                                      |
 * | `|`            | the next measure                                   |
 * | `'`            | an octave mark, ignored                            |
 *
 * Octave marks are ignored because the editor already separates the parts by
 * register when it plays them; write every part in the same octave.
 */
export type ScorePreset = {
    title: string;
    subtitle?: string;
    author?: string;
    /** An encoded key, the same form the masthead's key select uses. */
    key: string;
    /** An encoded time signature, the same form the masthead's time select uses. */
    timeSignature: string;
    tempo: { beatsPerMinute: number; description?: string; beatUnit?: NoteValue };
    /** One notation line per part, measures separated by `|`. */
    parts: Record<PartId, string>;
};

export class ScorePresetError extends Error {
    public constructor(message: string) {
        super(message);
        this.name = 'ScorePresetError';
    }
}

/** Turn a written preset into the document the editor opens with. */
export function parseScorePreset(preset: ScorePreset): EditorDocument {
    const timeSignature = timeSignatureFromOptionValue(preset.timeSignature);
    const written = PARTS.map((part) => ({
        partId: part.id,
        measures: splitMeasures(preset.parts[part.id]),
    }));
    const measureCount = Math.max(1, ...written.map((part) => part.measures.length));

    const measures: EditorMeasure[] = [];
    for (const part of written) {
        const cursor: SyllableCursor = {};
        for (let number = 1; number <= measureCount; number += 1) {
            const text = part.measures[number - 1] ?? '';
            measures.push(parseMeasure(part.partId, number, timeSignature, text, cursor));
        }
    }

    return {
        type: 'sol-fa-document',
        title: preset.title,
        subtitle: preset.subtitle ?? '',
        author: preset.author ?? '',
        timeSignature,
        key: keyFromOptionValue(preset.key),
        tempo: new Tempo(
            preset.tempo.beatUnit ?? NoteValue.QUARTER,
            preset.tempo.beatsPerMinute,
            preset.tempo.description ?? '',
        ),
        lyrics: '',
        measures,
    };
}

/** Split `d : m | f : s` into measures, keeping any measure that is written empty. */
function splitMeasures(line: string): string[] {
    const pieces = line.split('|').map((piece) => piece.trim());
    if (pieces[0] === '') pieces.shift();
    if (pieces[pieces.length - 1] === '') pieces.pop();
    return pieces;
}

/** The syllable a `-` continues, carried from one measure to the next. */
type SyllableCursor = { syllable?: SolfaSyllable };

function parseMeasure(
    part: PartId,
    number: number,
    timeSignature: TimeSignature,
    text: string,
    cursor: SyllableCursor,
): EditorMeasure {
    const measure = emptyMeasure(part, number, timeSignature);
    if (text === '') return measure;

    const beats = text.split(':');
    if (beats.length > measure.slots.length) {
        throw new ScorePresetError(
            `${part} measure ${number} writes ${beats.length} beats, but ${timeSignature.count} fit the time signature.`,
        );
    }

    return {
        ...measure,
        slots: measure.slots.map((slot, index) => {
            const beat = beats[index];
            return beat === undefined ? slot : parseBeat(slot, beat, cursor, part, number);
        }),
    };
}

function parseBeat(
    slot: EditorSlot,
    text: string,
    cursor: SyllableCursor,
    part: PartId,
    number: number,
): EditorSlot {
    const tokens = tokeniseBeat(text, part, number);
    if (tokens.length === 0) return slot;

    const notes: EditorNote[] = [];
    const marks: string[] = [];
    for (const token of tokens) {
        if (token.kind === 'mark') {
            marks.push(token.mark);
            continue;
        }
        if (token.kind === 'syllable') {
            cursor.syllable = token.syllable;
            notes.push({ id: createNoteId(slot.id), syllable: token.syllable });
            continue;
        }
        if (!cursor.syllable) {
            throw new ScorePresetError(
                `${part} measure ${number} sustains a note before any note has been written.`,
            );
        }
        notes.push({ id: createNoteId(slot.id), syllable: cursor.syllable, continuation: true });
    }

    const division = divisionForMarks(marks);
    if (notes.length > division) {
        throw new ScorePresetError(
            `${part} measure ${number} writes ${notes.length} notes in a beat divided in ${division}.`,
        );
    }

    return { ...slot, division, notes };
}

/** A `.` halves a beat and a `,` quarters it, so a comma always wins. */
function divisionForMarks(marks: readonly string[]): BeatDivision {
    if (marks.length === 0) return 1;
    return marks.includes(',') ? 4 : 2;
}

type BeatToken =
    | { kind: 'syllable'; syllable: SolfaSyllable }
    | { kind: 'continuation' }
    | { kind: 'mark'; mark: string };

const NATURAL_SET: ReadonlySet<string> = new Set(NATURAL_SOLFA_SYLLABLES);
const CHROMATIC_SET: ReadonlySet<string> = new Set(CHROMATIC_SOLFA_SYLLABLES);

function tokeniseBeat(text: string, part: PartId, number: number): BeatToken[] {
    const tokens: BeatToken[] = [];
    let index = 0;

    while (index < text.length) {
        const char = text[index];
        if (char === ' ' || char === "'") {
            index += 1;
            continue;
        }
        if (char === '-') {
            tokens.push({ kind: 'continuation' });
            index += 1;
            continue;
        }
        if (char === '.' || char === ',') {
            tokens.push({ kind: 'mark', mark: char });
            index += 1;
            continue;
        }

        const pair = text.slice(index, index + 2);
        if (CHROMATIC_SET.has(pair)) {
            tokens.push({ kind: 'syllable', syllable: pair as SolfaSyllable });
            index += 2;
            continue;
        }
        if (NATURAL_SET.has(char)) {
            tokens.push({ kind: 'syllable', syllable: char as SolfaSyllable });
            index += 1;
            continue;
        }

        throw new ScorePresetError(
            `${part} measure ${number} contains "${char}", which is not a sol-fa syllable.`,
        );
    }

    return tokens;
}
