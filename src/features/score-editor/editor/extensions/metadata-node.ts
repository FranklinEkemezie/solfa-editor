import { Node } from '@tiptap/core';

/**
 * The score's masthead as an editor node.
 *
 * The serializer writes a `metadata` node ahead of the measures so the Tiptap
 * document mirrors the editor document. Without a matching extension the node
 * type is unknown and Tiptap rejects the whole document, so this extension
 * exists to keep the two representations in step.
 */
export const MetadataNode = Node.create({
    name: 'metadata',
    group: 'block',
    atom: true,
    selectable: false,
    addAttributes: () => ({
        title: { default: '' },
        subtitle: { default: '' },
        author: { default: '' },
        lyrics: { default: '' },
    }),
    parseHTML: () => [{ tag: 'div[data-solfa-metadata]' }],
    renderHTML: ({ HTMLAttributes }) => ['div', { ...HTMLAttributes, 'data-solfa-metadata': '' }],
});
