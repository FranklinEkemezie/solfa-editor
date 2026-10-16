import { fraction, type Fraction } from './fraction';

export enum NoteValue {
    WHOLE = 'WHOLE',
    HALF = 'HALF',
    QUARTER = 'QUARTER',
    EIGHTH = 'EIGHTH',
    SIXTEENTH = 'SIXTEENTH',
    THIRTY_SECOND = 'THIRTY_SECOND',
    SIXTY_FOURTH = 'SIXTY_FOURTH',
}

export const NOTE_VALUE_UNITS: Record<NoteValue, Fraction> = {
    [NoteValue.WHOLE]: fraction(4),
    [NoteValue.HALF]: fraction(2),
    [NoteValue.QUARTER]: fraction(1),
    [NoteValue.EIGHTH]: fraction(1, 2),
    [NoteValue.SIXTEENTH]: fraction(1, 4),
    [NoteValue.THIRTY_SECOND]: fraction(1, 8),
    [NoteValue.SIXTY_FOURTH]: fraction(1, 16),
};
