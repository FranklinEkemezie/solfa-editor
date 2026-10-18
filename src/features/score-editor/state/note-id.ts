let counter = 0;

/**
 * A process-unique identifier for a written note.
 *
 * Notes are re-created on every edit, so the id is only used as a stable React
 * key and as the handle playback reports while a note sounds.
 */
export function createNoteId(scope: string): string {
    counter += 1;
    return `${scope}-n${counter}`;
}
