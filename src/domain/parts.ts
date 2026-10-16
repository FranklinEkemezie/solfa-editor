export type PartId = 'soprano' | 'alto' | 'tenor' | 'bass';

export const PARTS: ReadonlyArray<{ id: PartId; label: string; shortLabel: string }> = [
    { id: 'soprano', label: 'Soprano', shortLabel: 'S' },
    { id: 'alto', label: 'Alto', shortLabel: 'A' },
    { id: 'tenor', label: 'Tenor', shortLabel: 'T' },
    { id: 'bass', label: 'Bass', shortLabel: 'B' },
];
