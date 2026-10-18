import { useCallback } from 'react';
import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';
import type { EditorPosition } from '@/features/score-editor/state/editor-position';
import { resizeMeasuresToTimeSignature } from '@/features/score-editor/state/resize-measures';
import type { ScoreStore } from '@/features/score-editor/state/score-store';

export function useMetadataEditing(
    store: ScoreStore,
    commit: (document: EditorDocument, position?: EditorPosition) => void,
) {
    return useCallback(
        (document: EditorDocument) => {
            const timeChanged =
                document.timeSignature.count !== store.document.timeSignature.count ||
                document.timeSignature.note !== store.document.timeSignature.note;
            commit(
                timeChanged ? resizeMeasuresToTimeSignature(document) : document,
                store.position,
            );
        },
        [commit, store.document, store.position],
    );
}
