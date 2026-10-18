import { Letter } from '@/domain/music';

export const KEY_OPTIONS = [
    ...Object.values(Letter).map((letter) => ({
        label: `${letter} major`,
        value: `${letter}-MAJOR-NATURAL-0`,
    })),
    { label: 'A minor', value: 'A-MINOR-NATURAL-0' },
    { label: 'D minor', value: 'D-MINOR-NATURAL-1' },
    { label: 'G major', value: 'G-MAJOR-SHARP-1' },
    { label: 'F major', value: 'F-MAJOR-FLAT-1' },
];

export const TIME_SIGNATURE_OPTIONS = [
    { label: '2/4', value: '2/QUARTER' },
    { label: '3/4', value: '3/QUARTER' },
    { label: '4/4', value: '4/QUARTER' },
    { label: '6/8', value: '6/EIGHTH' },
];
