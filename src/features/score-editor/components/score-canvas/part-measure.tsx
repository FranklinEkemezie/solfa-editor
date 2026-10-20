import { markAfterBeat } from '@/domain/music';
import { ACCIDENTAL_MARKS } from '@/features/score-editor/components/score-canvas/accidental-mark';
import { BeatButton } from '@/features/score-editor/components/score-canvas/beat-button';
import { PART_ROW_HEIGHT_PX } from '@/features/score-editor/layout/page-geometry';
import type { BeatView, MeasureView, PartView } from '@/features/score-editor/model/score-view';
import type { EditorPosition } from '@/features/score-editor/editing/caret';

function writtenItem(item: BeatView['items'][number]): string {
    if (item.kind === 'continuation') return 'continuation';

    const octave =
        item.octaveOffset === 0
            ? ''
            : ` ${Math.abs(item.octaveOffset)} octave${
                  Math.abs(item.octaveOffset) === 1 ? '' : 's'
              } ${item.octaveOffset > 0 ? 'up' : 'down'}`;

    return `${item.syllable}${item.accidental ? (ACCIDENTAL_MARKS[item.accidental] ?? '') : ''}${octave}`;
}

function beatSummary(beat: BeatView): string {
    if (beat.items.length === 0) return ', empty';
    return `, ${beat.items.map(writtenItem).join(' ')}`;
}

/** One part's row of beats inside one measure. */
export function PartMeasure({
    part,
    measure,
    onPositionChange,
    activeBeatNumber,
    activeNoteKey,
}: {
    part: PartView;
    measure: MeasureView;
    onPositionChange: (position: EditorPosition) => void;
    /** The beat in this measure the caret is in, if any. */
    activeBeatNumber: number | null;
    activeNoteKey?: string | null;
}) {
    return (
        <div className="flex items-stretch px-1" style={{ height: PART_ROW_HEIGHT_PX }}>
            {measure.beats.map((beat, index) => (
                <BeatButton
                    key={beat.number}
                    beat={beat}
                    closingMark={
                        index < measure.beats.length - 1
                            ? markAfterBeat(index, measure.beats.length)
                            : null
                    }
                    isActive={activeBeatNumber === beat.number}
                    isPlaying={beat.items.some((item) => item.noteKey === activeNoteKey)}
                    ariaLabel={`${part.label}, measure ${measure.number}, beat ${beat.number}${beatSummary(beat)}`}
                    onSelect={() => onPositionChange({ part: part.id, offset: beat.sourceOffset })}
                />
            ))}
        </div>
    );
}
