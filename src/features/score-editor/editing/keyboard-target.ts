/**
 * True when a key event belongs to a text field rather than the score.
 *
 * The masthead and dialogs are edited with the same physical keyboard, so a
 * key pressed in one of their fields must never be read as notation or lyric
 * text.
 */
export function isTypingInAField(target: EventTarget | null): boolean {
    return (
        target instanceof HTMLElement &&
        target.closest('input, textarea, select, [contenteditable="true"]') !== null
    );
}
