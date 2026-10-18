import type { Key, TimeSignature } from '@/domain/music';

export type MetadataOption = { label: string; value: string };

/**
 * Key options in circle-of-fifths order.
 *
 * Each value encodes the letter, mode, signature accidental, and accidental
 * count — `G-MAJOR-SHARP-1` — so it can be parsed back into a `Key` without
 * keeping parallel state. The label carries the proper musical spelling.
 */
export const KEY_OPTIONS: MetadataOption[] = [
    { label: 'C major', value: 'C-MAJOR-NATURAL-0' },
    { label: 'G major', value: 'G-MAJOR-SHARP-1' },
    { label: 'D major', value: 'D-MAJOR-SHARP-2' },
    { label: 'A major', value: 'A-MAJOR-SHARP-3' },
    { label: 'E major', value: 'E-MAJOR-SHARP-4' },
    { label: 'B major', value: 'B-MAJOR-SHARP-5' },
    { label: 'F♯ major', value: 'F-MAJOR-SHARP-6' },
    { label: 'F major', value: 'F-MAJOR-FLAT-1' },
    { label: 'B♭ major', value: 'B-MAJOR-FLAT-2' },
    { label: 'E♭ major', value: 'E-MAJOR-FLAT-3' },
    { label: 'A♭ major', value: 'A-MAJOR-FLAT-4' },
    { label: 'D♭ major', value: 'D-MAJOR-FLAT-5' },
    { label: 'A minor', value: 'A-MINOR-NATURAL-0' },
    { label: 'E minor', value: 'E-MINOR-SHARP-1' },
    { label: 'B minor', value: 'B-MINOR-SHARP-2' },
    { label: 'F♯ minor', value: 'F-MINOR-SHARP-3' },
    { label: 'C♯ minor', value: 'C-MINOR-SHARP-4' },
    { label: 'D minor', value: 'D-MINOR-FLAT-1' },
    { label: 'G minor', value: 'G-MINOR-FLAT-2' },
    { label: 'C minor', value: 'C-MINOR-FLAT-3' },
    { label: 'F minor', value: 'F-MINOR-FLAT-4' },
];

export const TIME_SIGNATURE_OPTIONS: MetadataOption[] = [
    { label: '2/4', value: '2/QUARTER' },
    { label: '3/4', value: '3/QUARTER' },
    { label: '4/4', value: '4/QUARTER' },
    { label: '2/2', value: '2/HALF' },
    { label: '3/8', value: '3/EIGHTH' },
    { label: '6/8', value: '6/EIGHTH' },
    { label: '12/8', value: '12/EIGHTH' },
];

export function keyOptionValue(key: Key): string {
    return `${key.letter}-${key.mode}-${key.signature.accidental}-${key.signature.count}`;
}

export function timeSignatureOptionValue(signature: TimeSignature): string {
    return `${signature.count}/${signature.note}`;
}

/**
 * Guarantee a select can always show its current value, even when the score
 * holds a key or time signature that is not one of the curated options.
 */
export function withCurrentOption(
    options: MetadataOption[],
    value: string,
    label: string,
): MetadataOption[] {
    return options.some((option) => option.value === value)
        ? options
        : [{ label, value }, ...options];
}
