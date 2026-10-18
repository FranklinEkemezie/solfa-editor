import { Editor, type JSONContent } from '@tiptap/core';
import History from '@tiptap/extension-history';
import Text from '@tiptap/extension-text';
import { MeasureNode } from '@/features/score-editor/editor/extensions/measure-node';
import { MetadataNode } from '@/features/score-editor/editor/extensions/metadata-node';
import { SlotNode } from '@/features/score-editor/editor/extensions/slot-node';
import { SolfaDocument } from '@/features/score-editor/editor/extensions/solfa-document';

export function createScoreEditor(content: JSONContent): Editor {
    return new Editor({
        extensions: [SolfaDocument, MetadataNode, MeasureNode, SlotNode, Text, History],
        content,
        editorProps: {
            attributes: {
                'aria-label': 'Keyboard input for the score',
                class: 'tiptap-score-capture',
            },
        },
    });
}
