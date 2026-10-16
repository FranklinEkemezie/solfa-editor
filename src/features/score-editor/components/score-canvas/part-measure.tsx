import { EditorDocument } from '../../adapters/editor-document-schema';
import { EditorPosition } from '../../state/score-commands';

export default function PartMeasure({
    measure,
    position,
    onPositionChange,
    activeSlotId,
}: {
    measure: EditorDocument['measures'][number];
    position: EditorPosition;
    onPositionChange: (position: EditorPosition) => void;
    activeSlotId?: string | null;
}) {
    return (
        <div className="part-measure">
            {measure.slots.map((slot, slotIndex) => {
                const isActive =
                    position.measureId === measure.id && position.slotIndex === slotIndex;
                const isPlayingNow = activeSlotId === slot.id;
                return (
                    <button
                        key={slot.id}
                        type="button"
                        className={`rhythm-slot focus:outline-none ${slot.syllable ? 'rhythm-slot-filled' : 'rhythm-slot-empty'} ${isActive ? 'rhythm-slot-active ' : ''} ${isPlayingNow ? 'rhythm-slot-playing' : ''}`}
                        onClick={(event) => {
                            event.stopPropagation();
                            onPositionChange({ measureId: measure.id, slotIndex });
                        }}
                        aria-label={`${measure.part}, measure ${measure.number}, position ${slotIndex + 1}${slot.syllable ? `, ${slot.syllable}` : ', empty'}`}
                    >
                        <span className="slot-note">
                            {slot.continuation ? '—' : (slot.syllable ?? ' ')}
                        </span>
                        {slot.lyric ? <span className="slot-lyric">{slot.lyric}</span> : null}
                        {slot.noteValue !== 'QUARTER' ? (
                            <span className="slot-subdivision">
                                {slot.noteValue === 'EIGHTH' ? '½' : '·'}
                            </span>
                        ) : null}
                        <span className="slot-separator text-lg">:</span>

                        {/*{!slot.syllable && slot.noteValue === 'QUARTER' ? (*/}
                        {/*    <span className="slot-separator text-lg">:</span>*/}
                        {/*) : null}*/}
                    </button>
                );
            })}
        </div>
    );
}
