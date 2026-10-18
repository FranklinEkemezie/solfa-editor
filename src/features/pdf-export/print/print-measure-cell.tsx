import { beatMarkBetween } from '@/domain/music';
import type { EditorMeasure } from '@/features/score-editor/adapters/editor-document-schema';

export function PrintMeasureCell({ measure }: { measure?: EditorMeasure }) {
    return (
        <div className="flex min-h-[34pt] items-center gap-2 border-l border-line px-2 py-[2pt] last:border-r">
            {(measure?.slots ?? []).map((slot) => (
                <span key={slot.id} className="inline-flex items-baseline">
                    {slot.notes.length > 0 ? (
                        slot.notes.map((note, index) => (
                            <span key={note.id} className="inline-flex items-baseline">
                                {index > 0 ? (
                                    <span className="px-[1pt] text-ghost">
                                        {beatMarkBetween(slot.division, index - 1)}
                                    </span>
                                ) : null}
                                <span
                                    className={`inline-block min-w-[14pt] text-center text-[17pt] leading-none ${note.syllable ? 'text-ink' : 'text-ghost'}`}
                                >
                                    {note.continuation ? '—' : (note.syllable ?? ':')}
                                </span>
                            </span>
                        ))
                    ) : (
                        <span className="inline-block min-w-[14pt] text-center text-[17pt] leading-none text-ghost">
                            :
                        </span>
                    )}
                </span>
            ))}
        </div>
    );
}
