import { useCallback } from 'react';
import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';
import { editorToDomain } from '@/features/score-editor/adapters/editor-to-domain';
import type { EditorPosition } from '@/features/score-editor/state/editor-position';
import type { ScoreStore } from '@/features/score-editor/state/score-store';

export function useCommit(store: ScoreStore, onInvalid: (message: string) => void) {
    return useCallback(
        (document: EditorDocument, position?: EditorPosition) => {
            try {
                editorToDomain(document);
                store.commit(document, position);
            } catch (error) {
                onInvalid(
                    error instanceof Error
                        ? error.message
                        : 'That edit would make the score invalid.',
                );
            }
        },
        [onInvalid, store],
    );
}
