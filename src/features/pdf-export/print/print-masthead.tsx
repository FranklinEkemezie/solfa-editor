import { timeSignatureLabel } from '@/domain/music';
import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';
import { metadataKeyLabel } from '@/features/score-editor/adapters/metadata-label';

/**
 * The title block at the head of the first printed sheet.
 *
 * It reads exactly as the editor's masthead does — the title, its subtitle,
 * then one row with the musical facts on the left and the composer on the
 * right — so the page that comes off the printer is the page that was on
 * screen. Type is set in points, which is the printer's own unit.
 *
 * The block is given room to stand in: air above it, air between the title and
 * its details, and air below it before the music starts. A heading pressed
 * against the first system reads as a caption.
 */
export function PrintMasthead({ document }: { document: EditorDocument }) {
    return (
        <header className="mb-[42px] pt-[8px] text-center">
            <h1 className="m-0 font-serif text-[20pt] font-semibold leading-[1.15] text-ink">
                {document.title || 'Untitled solfa'}
            </h1>
            {document.subtitle ? (
                <p className="m-0 mt-[6px] font-serif text-[10pt] italic leading-snug text-ink-muted">
                    {document.subtitle}
                </p>
            ) : null}
            <div className="mt-[20px] flex items-baseline justify-between border-t border-ink-muted/40 pt-[8px] text-[9pt] leading-snug text-ink-muted">
                <span className="flex items-baseline">
                    <span>{metadataKeyLabel(document)}</span>
                    <span className="px-[4pt]">·</span>
                    <span>{timeSignatureLabel(document.timeSignature)}</span>
                    {document.tempo.description ? (
                        <>
                            <span className="px-[4pt]">·</span>
                            <span className="italic">{document.tempo.description}</span>
                        </>
                    ) : null}
                    <span className="px-[4pt]">·</span>
                    <span>♩ = {document.tempo.beatsPerMinute}</span>
                </span>
                <span className="italic">{`By ${document.author || 'Anonymous'}`}</span>
            </div>
        </header>
    );
}
