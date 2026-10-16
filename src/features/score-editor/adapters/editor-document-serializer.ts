import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';

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
