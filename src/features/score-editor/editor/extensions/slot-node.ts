import { Node } from '@tiptap/core';

export const SlotNode = Node.create({
    name: 'slot',
    content: 'note*',
    defining: true,
    addAttributes: () => ({
        id: { default: '' },
        noteValue: { default: 'QUARTER' },
        division: { default: 1 },
    }),
    parseHTML: () => [{ tag: 'div[data-solfa-slot]' }],
    renderHTML: ({ HTMLAttributes }) => ['div', { ...HTMLAttributes, 'data-solfa-slot': '' }, 0],
});
