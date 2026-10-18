import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';
import { SlotButton } from '@/features/score-editor/components/score-canvas/slot-button';
import type { EditorPosition } from '@/features/score-editor/state/editor-position';

function beatSummary(notes: EditorDocument['measures'][number]['slots'][number]['notes']): string {
    if (notes.length === 0) return ', empty';
    const written = notes.map((note) =>
        note.continuation ? 'continuation' : (note.syllable ?? 'rest'),
    );
    return `, ${written.join(' ')}`;
}

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
                    ariaLabel={`${measure.part}, measure ${measure.number}, beat ${slotIndex + 1}${beatSummary(slot.notes)}`}
                    onSelect={() => onPositionChange({ measureId: measure.id, slotIndex })}
                />
            ))}
        </div>
    );
}
