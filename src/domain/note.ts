import { MusicalEvent } from './musical-event';
import { Pitch } from './pitch';
import { Duration } from './duration';
import { SolfaSyllable } from './music';

export class Note extends MusicalEvent {
    public readonly pitch: Pitch;
    public readonly syllable: SolfaSyllable;
    public readonly continuation: boolean;
    public readonly lyric: string;

    public constructor(
        pitch: Pitch,
        duration: Duration,
        syllable: SolfaSyllable,
        continuation = false,
        lyric = '',
    ) {
        super(duration);
        this.pitch = pitch;
        this.syllable = syllable;
        this.continuation = continuation;
        this.lyric = lyric;
    }
}

export default Note;
