import { Node } from '@tiptap/core';

export const SlotNode = Node.create({
    name: 'slot',
    group: 'inline',
    inline: true,
    atom: true,
    selectable: false,
    addAttributes: () => ({
        id: { default: '' },
        noteValue: { default: 'QUARTER' },
        syllable: { default: null },
        continuation: { default: false },
    }),
    parseHTML: () => [{ tag: 'span[data-solfa-slot]' }],
    renderHTML: ({ HTMLAttributes }) => ['span', { ...HTMLAttributes, 'data-solfa-slot': '' }],
});
