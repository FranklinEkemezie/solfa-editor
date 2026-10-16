import type { Key, PartId, SolfaSyllable, Tempo, TimeSignature } from '@/domain/music';
import { Accidental, Duration, Key as DomainKey, Letter, Mode, NoteValue } from '@/domain/music';

export type EditorSlot = {
    id: string;
    noteValue: NoteValue;
    syllable?: SolfaSyllable;
    continuation?: boolean;
    lyric?: string;
};

export type EditorMeasure = {
    id: string;
    part: PartId;
    number: number;
    timeSignature: TimeSignature;
    slots: EditorSlot[];
};

export type EditorDocument = {
    type: 'solfa-document';
    title: string;
    author: string;
    timeSignature: TimeSignature;
    key: Key;
    tempo: Tempo;
    lyrics: string;
    measures: EditorMeasure[];
};

export type TiptapNode = {
    type: string;
    attrs?: Record<string, string | number | boolean | null>;
    content?: TiptapNode[];
};

export function toTiptapJson(document: EditorDocument): TiptapNode {
    return {
        type: 'doc',
        content: [
            {
                type: 'metadata',
                attrs: {
                    title: document.title,
                    author: document.author,
                    lyrics: document.lyrics ?? '',
                },
            },
            ...document.measures.map((measure) => ({
                type: 'measure',
                attrs: { id: measure.id, part: measure.part, number: measure.number },
                content: measure.slots.map((slot) => ({
                    type: 'slot',
                    attrs: {
                        id: slot.id,
                        noteValue: slot.noteValue,
                        syllable: slot.syllable ?? null,
                        continuation: slot.continuation ?? false,
                        lyric: slot.lyric ?? null,
                    },
                })),
            })),
        ],
    };
}

export function fromTiptapJson(value: unknown, source: EditorDocument): EditorDocument {
    if (!isRecord(value) || value.type !== 'doc' || !Array.isArray(value.content)) {
        throw new Error('The editor document is not a valid Tiptap document.');
    }
    const metadataNode = value.content.find(
        (node) => isRecord(node) && node.type === 'metadata',
    ) as Record<string, unknown> | undefined;
    const lyrics =
        metadataNode && isRecord(metadataNode.attrs)
            ? String(metadataNode.attrs.lyrics ?? source.lyrics ?? '')
            : (source.lyrics ?? '');
    const measureById = new Map(source.measures.map((measure) => [measure.id, measure]));
    const measures = value.content
        .filter((node) => isRecord(node) && node.type === 'measure')
        .map((node, measureIndex) => {
            if (!isRecord(node) || node.type !== 'measure' || !isRecord(node.attrs)) {
                throw new Error(`Invalid measure at editor position ${measureIndex + 1}.`);
            }
            const sourceMeasure = measureById.get(String(node.attrs.id));
            if (!sourceMeasure || !Array.isArray(node.content)) {
                throw new Error(
                    `Unknown or incomplete measure at editor position ${measureIndex + 1}.`,
                );
            }
            const slots = node.content.map((slotNode, slotIndex) => {
                if (!isRecord(slotNode) || slotNode.type !== 'slot' || !isRecord(slotNode.attrs)) {
                    throw new Error(`Invalid rhythmic position ${slotIndex + 1}.`);
                }
                const attrs = slotNode.attrs;
                const noteValue = parseNoteValue(attrs.noteValue);
                const syllable = parseSyllable(attrs.syllable);
                return {
                    id: String(attrs.id),
                    noteValue,
                    ...(syllable ? { syllable } : {}),
                    continuation: attrs.continuation === true,
                    lyric: typeof attrs.lyric === 'string' ? attrs.lyric : undefined,
                } satisfies EditorSlot;
            });
            return { ...sourceMeasure, slots };
        });
    return { ...source, lyrics, measures };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function parseNoteValue(value: unknown): NoteValue {
    if (typeof value === 'string' && Object.values(NoteValue).includes(value as NoteValue)) {
        return value as NoteValue;
    }
    throw new Error('The editor contains an unsupported note value.');
}

function parseSyllable(value: unknown): SolfaSyllable | undefined {
    return typeof value === 'string' && ['d', 'r', 'm', 'f', 's', 'l', 't'].includes(value)
        ? (value as SolfaSyllable)
        : undefined;
}

export function serializeDocument(document: EditorDocument): string {
    return JSON.stringify(toTiptapJson(document));
}

export const DEFAULT_EDITOR_KEY = new DomainKey(
    Letter.C,
    { accidental: Accidental.NATURAL, count: 0 } as never,
    Mode.MAJOR,
);

export const EMPTY_DURATION = new Duration(NoteValue.QUARTER);
