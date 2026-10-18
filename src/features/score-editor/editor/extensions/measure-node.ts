import { Node } from '@tiptap/core';

export const MeasureNode = Node.create({
    name: 'measure',
    group: 'block',
    content: 'slot*',
    defining: true,
    parseHTML: () => [{ tag: 'div[data-solfa-measure]' }],
    renderHTML: ({ HTMLAttributes }) => ['div', { ...HTMLAttributes, 'data-solfa-measure': '' }, 0],
});
