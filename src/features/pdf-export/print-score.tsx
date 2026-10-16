import type { EditorDocument } from '../score-editor/adapters/editor-document-schema';
import { metadataKeyLabel } from '../score-editor/adapters/editor-to-domain';
import { PARTS } from '@/domain/music';

export function PrintScore({ document }: { document: EditorDocument }) {
    const measures = document.measures
        .filter((measure) => measure.part === 'soprano')
        .sort((a, b) => a.number - b.number);
    const totalMeasures = measures.length;

    return (
        <main className="print-sheet" id="print-view">
            <header className="border-b border-[#d4dbd6] pb-[10pt] mb-[18pt] text-center">
                <p className="mb-[6pt] text-[8pt] font-bold uppercase tracking-[0.18em] text-[#597b68]">
                    SATB tonic sol-fa
                </p>
                <h1 className="m-0 mb-[4pt] text-[24pt] font-medium">
                    {document.title || 'Untitled solfa'}
                </h1>
                <p className="m-0 italic text-[#5a6f63]">
                    {document.author ? `by ${document.author}` : 'Anonymous composition'}
                </p>
                <p className="mt-[6pt] text-[11pt]">
                    {metadataKeyLabel(document)} · {document.timeSignature.count}/
                    {denominator(document.timeSignature.note)} · ♩ = {document.tempo.beatsPerMinute}
                </p>
                {document.tempo.description ? (
                    <p className="mt-[6pt] text-[11pt] italic text-[#4d685d]">
                        {document.tempo.description}
                    </p>
                ) : null}
            </header>

            <div
                className="overflow-hidden rounded-lg border border-[#dfe7e1]"
                style={{ ['--print-measures' as string]: String(totalMeasures) }}
            >
                <div
                    className="grid items-center border-b border-[#dfe7e1] bg-[#f3f7f3] py-1.5 text-[8pt] font-bold uppercase tracking-[0.08em] text-[#76877d]"
                    style={{
                        gridTemplateColumns: `26pt repeat(${totalMeasures}, minmax(48pt, 1fr))`,
                    }}
                >
                    <div />
                    {measures.map((measure) => (
                        <span key={measure.id} className="text-center">
                            m{measure.number}
                        </span>
                    ))}
                </div>

                {PARTS.map((part) => (
                    <div
                        key={part.id}
                        className="grid min-h-[34pt] items-center border-t border-[#e4ebdf]"
                        style={{
                            gridTemplateColumns: `26pt repeat(${totalMeasures}, minmax(48pt, 1fr))`,
                        }}
                    >
                        <strong className="self-center px-2 text-[11pt] font-bold uppercase tracking-[0.08em] text-[#1e352d]">
                            {part.shortLabel}
                        </strong>
                        {measures.map((measure) => {
                            const partMeasure = document.measures.find(
                                (candidate) =>
                                    candidate.part === part.id &&
                                    candidate.number === measure.number,
                            );
                            return (
                                <div
                                    key={`${part.id}-${measure.number}`}
                                    className="flex min-h-[34pt] items-center gap-2 border-l border-[#d4dad3] px-2 py-[2pt] last:border-r last:border-[#d4dad3]"
                                >
                                    {(partMeasure?.slots ?? []).map((slot) => (
                                        <span
                                            key={slot.id}
                                            className={`inline-block min-w-[14pt] text-center text-[17pt] leading-none ${slot.syllable ? 'text-[#20362a]' : 'text-[#b7c2bb]'}`}
                                        >
                                            {slot.continuation ? '—' : (slot.syllable ?? ':')}
                                        </span>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            <footer className="mt-5 border-t border-[#d7ddd8] pt-[7pt] text-right text-[8pt] text-[#77877d]">
                Solfa editor · composed in the browser
            </footer>
        </main>
    );
}

function denominator(note: EditorDocument['timeSignature']['note']): number {
    const values = {
        WHOLE: 1,
        HALF: 2,
        QUARTER: 4,
        EIGHTH: 8,
        SIXTEENTH: 16,
        THIRTY_SECOND: 32,
        SIXTY_FOURTH: 64,
    } as const;
    return values[note];
}
