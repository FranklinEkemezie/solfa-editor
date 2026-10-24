import {
    createEmptyScoreDocument,
    NoteValue,
    Tempo,
    UNTITLED_SCORE_TITLE,
    type Key,
    type ScoreDocument,
    type TimeSignature,
} from '@/domain/music';

/**
 * The details the New document dialog collects.
 *
 * A new score starts as the same blank four-measure document the editor has
 * always opened with; these details replace only its masthead and musical
 * settings. The notation is left empty, so the writer begins with a clean page
 * while keeping a title, key and tempo they chose up front.
 */
export type NewDocumentDetails = {
    readonly title: string;
    readonly subtitle: string;
    readonly author: string;
    readonly key: Key;
    readonly timeSignature: TimeSignature;
    readonly tempo: Tempo;
};

export function createDocumentFromDetails(details: NewDocumentDetails): ScoreDocument {
    return {
        ...createEmptyScoreDocument(),
        title: details.title.trim() || UNTITLED_SCORE_TITLE,
        subtitle: details.subtitle.trim(),
        author: details.author.trim(),
        key: details.key,
        timeSignature: details.timeSignature,
        tempo: details.tempo,
    };
}

/**
 * The starting values shown when the dialog opens.
 *
 * The new sheet borrows the current key, time signature, speed and marking,
 * but starts on a quarter-note beat: that is the common metronome mark, and a
 * writer who wants a half-note or eighth-note beat can choose it explicitly.
 */
export function newDocumentDetails(document: ScoreDocument): NewDocumentDetails {
    return {
        title: '',
        subtitle: '',
        author: '',
        key: document.key,
        timeSignature: document.timeSignature,
        tempo: new Tempo(
            NoteValue.QUARTER,
            document.tempo.beatsPerMinute,
            document.tempo.description,
        ),
    };
}
