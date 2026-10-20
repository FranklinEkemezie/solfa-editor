import type { ScoreDocument } from '@/domain/music';
import { keyLabel } from '@/features/score-editor/adapters/metadata-options';

export function metadataKeyLabel(document: Pick<ScoreDocument, 'key'>): string {
    return keyLabel(document.key);
}
