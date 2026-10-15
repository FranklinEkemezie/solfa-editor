import * as Tone from 'tone';
import { PARTS, SOLFA_TO_PITCH, type PartId, type SolfaSyllable } from '../../domain/music';
import type { EditorDocument } from '../score-editor/adapters/editor-document-schema';

export type PlaybackEvent = {
  time: number;
  note: string;
  duration: string;
  syllable: SolfaSyllable;
  part: PartId;
};

const PART_OCTAVE_OFFSETS: Record<PartId, number> = {
  soprano: 12,
  alto: 7,
  tenor: -12,
  bass: -24,
};

function noteValueToQuarterUnits(value: EditorDocument['timeSignature']['note']): number {
  switch (value) {
    case 'WHOLE': return 4;
    case 'HALF': return 2;
    case 'QUARTER': return 1;
    case 'EIGHTH': return 0.5;
    case 'SIXTEENTH': return 0.25;
    case 'THIRTY_SECOND': return 0.125;
    case 'SIXTY_FOURTH': return 0.0625;
    default: return 1;
  }
}

function getBeatSeconds(document: EditorDocument): number {
  const beatUnit = noteValueToQuarterUnits(document.tempo.beatUnit);
  const measureUnit = noteValueToQuarterUnits(document.timeSignature.note);
  if (beatUnit <= 0) return 60 / document.tempo.beatsPerMinute;
  const effectiveBeats = (measureUnit / beatUnit) * (60 / document.tempo.beatsPerMinute);
  return effectiveBeats;
}

export function buildPlaybackEvents(document: EditorDocument): PlaybackEvent[] {
  const measureNumbers = [...new Set(document.measures.map((measure) => measure.number))]
    .sort((left, right) => left - right);

  const events: PlaybackEvent[] = [];
  const beatSeconds = getBeatSeconds(document);
  let clock = 0;

  for (const measureNumber of measureNumbers) {
    for (const part of PARTS) {
      const measure = document.measures.find((candidate) => candidate.part === part.id && candidate.number === measureNumber);
      if (!measure) continue;

      let slotOffset = 0;
      for (const slot of measure.slots) {
        if (!slot.syllable) {
          slotOffset += noteValueToQuarterUnits(slot.noteValue);
          continue;
        }

        const pitch = SOLFA_TO_PITCH[slot.syllable];
        const midi = pitch.toMidi() + PART_OCTAVE_OFFSETS[part.id];
        const durationBeats = noteValueToQuarterUnits(slot.noteValue) / noteValueToQuarterUnits(document.tempo.beatUnit);
        const noteDuration = `${Math.max(durationBeats, 0.125)}n`;

        events.push({
          time: clock + slotOffset * beatSeconds,
          note: Tone.Frequency(midi, 'midi').toNote(),
          duration: noteDuration,
          syllable: slot.syllable,
          part: part.id,
        });

        slotOffset += noteValueToQuarterUnits(slot.noteValue);
      }
    }

    const measureDuration = (document.timeSignature.count * noteValueToQuarterUnits(document.timeSignature.note)) / noteValueToQuarterUnits(document.tempo.beatUnit);
    clock += measureDuration * beatSeconds;
  }

  return events.sort((left, right) => left.time - right.time);
}

export class ScorePlayer {
  private synth: Tone.PolySynth | null = null;
  private part: Tone.Part | null = null;

  public async start(document: EditorDocument): Promise<void> {
    this.stop();
    await Tone.start();

    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.02, decay: 0.14, sustain: 0.2, release: 0.4 },
    }).toDestination();

    const events = buildPlaybackEvents(document);
    this.part = new Tone.Part((time, value) => {
      const event = value as PlaybackEvent;
      this.synth?.triggerAttackRelease(event.note, event.duration, time);
    }, events.map((event) => [event.time, event] as [number, PlaybackEvent]));

    this.part.start(0);
    Tone.Transport.bpm.value = document.tempo.beatsPerMinute;
    Tone.Transport.start('+0.05');
  }

  public stop(): void {
    if (this.part) {
      this.part.stop();
      this.part.dispose();
      this.part = null;
    }

    if (this.synth) {
      this.synth.dispose();
      this.synth = null;
    }

    Tone.Transport.stop();
    Tone.Transport.cancel(0);
    Tone.Transport.position = 0;
  }

  public dispose(): void {
    this.stop();
  }
}
