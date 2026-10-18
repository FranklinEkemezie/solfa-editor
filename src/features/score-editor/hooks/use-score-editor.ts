import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/core';
import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';
import { toTiptapJson } from '@/features/score-editor/adapters/editor-document-serializer';
import { createScoreEditor } from '@/features/score-editor/editor/create-editor';

export function useScoreEditor(document: EditorDocument): Editor {
    const [editor] = useState(() => createScoreEditor(toTiptapJson(document)));

    useEffect(() => {
        editor.commands.setContent(toTiptapJson(document));
    }, [editor, document]);

    return editor;
}
