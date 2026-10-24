import { describe, expect, it } from 'vitest';
import {
    Accidental,
    createEmptyScoreDocument,
    Key,
    KeySignature,
    Letter,
    Mode,
    NoteValue,
    Tempo,
    TimeSignature,
} from '@/domain/music';
import {
    createDocumentFromDetails,
    newDocumentDetails,
} from '@/features/document-library/document-details';

const DETAILS = {
    title: '  New anthem  ',
    subtitle: ' for the choir ',
    author: ' A. Composer ',
    key: new Key(Letter.F, new KeySignature(Accidental.FLAT, 1), Mode.MAJOR),
    timeSignature: new TimeSignature(NoteValue.EIGHTH, 6),
    tempo: new Tempo(NoteValue.QUARTER, 84, 'Andante'),
};

describe('a document created from the dialog', () => {
    it('keeps the supplied details and starts with blank music', () => {
        const document = createDocumentFromDetails(DETAILS);

        expect(document.title).toBe('New anthem');
        expect(document.subtitle).toBe('for the choir');
        expect(document.author).toBe('A. Composer');
        expect(document.key.letter).toBe(Letter.F);
        expect(document.timeSignature.count).toBe(6);
        expect(document.tempo.beatsPerMinute).toBe(84);
        expect(document.voices.soprano).toBe('');
        expect(document.measureCount).toBe(4);
    });

    it('falls back to the untitled name when no title is given', () => {
        expect(createDocumentFromDetails({ ...DETAILS, title: '   ' }).title).toBe(
            'Untitled sheet',
        );
    });

    it('starts the dialog with the current musical settings', () => {
        const current = createEmptyScoreDocument();

        const details = newDocumentDetails(current);

        expect(details.title).toBe('');
        expect(details.key).toBe(current.key);
        expect(details.timeSignature).toBe(current.timeSignature);
        expect(details.tempo).toBe(current.tempo);
    });
});
