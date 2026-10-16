import { MusicalEvent } from './musical-event';
import { Note } from './note';
import { Duration } from './duration';
import { NoteValue } from './music';

export class Tuplet extends MusicalEvent {
    public readonly notes: Note[];

    public constructor(notes: Note[], duration = new Duration(NoteValue.QUARTER)) {
        super(duration);
        this.notes = [...notes];
    }
}

export class Triplet extends Tuplet {
    public constructor(notes: [Note, Note, Note], duration?: Duration) {
        super(notes, duration);
    }
}

export class Quintuplet extends Tuplet {
    public constructor(notes: Note[], duration?: Duration) {
        super(notes, duration);
    }
}

export class Sextuplet extends Tuplet {
    public constructor(notes: [Note, Note, Note, Note, Note, Note], duration?: Duration) {
        super(notes, duration);
    }
}

export default Tuplet;
