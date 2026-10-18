import { Key } from '@/domain/key';
import { Tempo } from '@/domain/tempo';
import { TimeSignature } from '@/domain/time-signature';
import { Measure } from '@/domain/measure';

export class Score {
    public readonly title: string;
    /** A second line under the title, such as a movement or an incipit. */
    public readonly subtitle: string;
    public readonly author: string;
    public readonly timeSignature: TimeSignature;
    public readonly key: Key;
    public readonly tempo: Tempo;
    public readonly measures: Measure[];
    public readonly lyrics: string;

    /**
     * `subtitle` is last so scores written before it existed keep their meaning
     * positionally; every other detail already had a position of its own.
     */
    public constructor(
        title: string,
        timeSignature: TimeSignature,
        key: Key,
        tempo: Tempo,
        measures: Measure[],
        author = '',
        lyrics = '',
        subtitle = '',
    ) {
        this.title = title;
        this.subtitle = subtitle;
        this.author = author;
        this.timeSignature = timeSignature;
        this.key = key;
        this.tempo = tempo;
        this.measures = [...measures];
        this.lyrics = lyrics;
    }
}

export default Score;
