import type { EditorMeasure } from '@/features/score-editor/adapters/editor-document-schema';

export function PrintMeasureCell({ measure }: { measure?: EditorMeasure }) {
    return (
        <div className="flex min-h-[34pt] items-center gap-2 border-l border-line px-2 py-[2pt] last:border-r">
            {(measure?.slots ?? []).map((slot) => (
                <span
                    key={slot.id}
                    className={`inline-block min-w-[14pt] text-center text-[17pt] leading-none ${slot.syllable ? 'text-ink' : 'text-ghost'}`}
                >
                    {slot.continuation ? '—' : (slot.syllable ?? ':')}
                </span>
            ))}
        </div>
    );
}
