import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';

export type TiptapNode = {
    type: string;
    attrs?: Record<string, string | number | boolean | null>;
    content?: TiptapNode[];
};

/**
 * Serialise the editor document for the hidden Tiptap capture surface.
 *
 * The shape mirrors the stored document — a masthead, measures, beats, and the
 * notes inside each beat — so the editor schema and the store never drift
 * apart.
 */
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
                        division: slot.division,
                    },
                    content: slot.notes.map((note) => ({
                        type: 'note',
                        attrs: {
                            id: note.id,
                            syllable: note.syllable ?? null,
                            continuation: note.continuation ?? false,
                            lyric: note.lyric ?? null,
                        },
                    })),
                })),
            })),
        ],
    };
}
