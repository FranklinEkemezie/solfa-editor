import { Duration } from './duration';

export abstract class MusicalEvent {
    public readonly duration: Duration;

    protected constructor(duration: Duration) {
        this.duration = duration;
    }
}

export default MusicalEvent;
