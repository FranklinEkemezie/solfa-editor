import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';
import { SlotButton } from '@/features/score-editor/components/score-canvas/slot-button';
import type { EditorPosition } from '@/features/score-editor/state/editor-position';

export function PartMeasure({
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
        <div className="flex h-[52px] items-center border-b border-line-soft px-2 last:border-b-0">
            {measure.slots.map((slot, slotIndex) => (
                <SlotButton
                    key={slot.id}
                    slot={slot}
                    isActive={position.measureId === measure.id && position.slotIndex === slotIndex}
                    isPlaying={activeSlotId === slot.id}
                    ariaLabel={`${measure.part}, measure ${measure.number}, position ${slotIndex + 1}${slot.syllable ? `, ${slot.syllable}` : ', empty'}`}
                    onSelect={() => onPositionChange({ measureId: measure.id, slotIndex })}
                />
            ))}
        </div>
    );
}
