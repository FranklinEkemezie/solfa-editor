import { Accidental } from '@/domain/music';
import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';

export function metadataKeyLabel(document: EditorDocument): string {
    const accidental = document.key.signature.accidental;
    const symbol =
        accidental === Accidental.SHARP ? '♯' : accidental === Accidental.FLAT ? '♭' : '';
    return `${document.key.letter}${symbol} ${document.key.mode === 'MAJOR' ? 'Major' : 'Minor'}`;
}
