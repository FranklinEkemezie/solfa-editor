import { Editor, Node, type JSONContent } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import History from '@tiptap/extension-history';
import Text from '@tiptap/extension-text';

const SolfaDocument = Document.extend({
  content: 'measure*',
});

const MeasureNode = Node.create({
  name: 'measure',
  group: 'block',
  content: 'slot*',
  defining: true,
  parseHTML: () => [{ tag: 'div[data-solfa-measure]' }],
  renderHTML: ({ HTMLAttributes }) => ['div', { ...HTMLAttributes, 'data-solfa-measure': '' }, 0],
});

const SlotNode = Node.create({
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

export function createScoreEditor(content: JSONContent): Editor {
  return new Editor({
    extensions: [SolfaDocument, MeasureNode, SlotNode, Text, History],
    content,
    editorProps: {
      attributes: {
        'aria-label': 'Keyboard input for the score',
        class: 'tiptap-score-capture',
      },
    },
  });
}
