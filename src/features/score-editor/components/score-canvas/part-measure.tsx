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
        <div className="flex h-[52px] items-center border-b border-[#e5e9e4] px-2 last:border-b-0">
            {measure.slots.map((slot, slotIndex) => {
                const isActive =
                    position.measureId === measure.id && position.slotIndex === slotIndex;
                const isPlayingNow = activeSlotId === slot.id;
                return (
                    <button
                        key={slot.id}
                        type="button"
                        className={`relative flex h-10 min-w-[38px] flex-1 items-center justify-center rounded-lg border-0 bg-transparent text-[#aab4ab] focus:outline-none ${slot.syllable ? 'text-ink' : 'text-[#c0c8c1]'} ${isActive ? 'bg-green-wash text-green-dark ring-1 ring-[#bdd3c1]' : ''} ${isPlayingNow ? 'bg-[rgba(93,130,109,0.12)] ring-1 ring-[rgba(93,130,109,0.18)]' : ''}`}
                        onClick={(event) => {
                            event.stopPropagation();
                            onPositionChange({ measureId: measure.id, slotIndex });
                        }}
                        aria-label={`${measure.part}, measure ${measure.number}, position ${slotIndex + 1}${slot.syllable ? `, ${slot.syllable}` : ', empty'}`}
                    >
                        <span className="relative z-[1] font-mono text-[1.2rem] font-normal leading-none">
                            {slot.continuation ? '—' : (slot.syllable ?? ' ')}
                        </span>
                        {slot.lyric ? (
                            <span className="absolute -bottom-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#4f5f58]">
                                {slot.lyric}
                            </span>
                        ) : null}
                        {slot.noteValue !== 'QUARTER' ? (
                            <span className="absolute right-1 top-1 text-[1.2rem] font-normal text-amber">
                                {slot.noteValue === 'EIGHTH' ? '½' : '·'}
                            </span>
                        ) : null}
                        <span className="absolute right-[-2px] top-1/2 z-[2] inline-block -translate-y-1/2 text-[1.2rem] leading-none text-ink">
                            :
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
