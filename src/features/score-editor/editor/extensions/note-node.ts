import { Node } from '@tiptap/core';

export const NoteNode = Node.create({
    name: 'note',
    inline: true,
    atom: true,
    selectable: false,
    addAttributes: () => ({
        id: { default: '' },
        syllable: { default: null },
        continuation: { default: false },
        lyric: { default: null },
    }),
    parseHTML: () => [{ tag: 'span[data-solfa-note]' }],
    renderHTML: ({ HTMLAttributes }) => ['span', { ...HTMLAttributes, 'data-solfa-note': '' }],
});
