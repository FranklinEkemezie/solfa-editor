/**
 * The double barline that closes a score.
 *
 * A thin line, a hair of air, then a thick one: the mark a printed score ends
 * with, and the one thing that tells a reader the music has finished rather
 * than turned the page. The sheet and the printed page share this mark so the
 * end looks the same in both, and it is drawn inside the measure's own width so
 * it never pushes the music wider than the layout measured.
 */
export function FinalBarline() {
    return (
        <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 flex w-[5px] items-stretch"
        >
            <span className="w-px bg-ink" />
            <span className="ml-[2px] w-[2px] bg-ink" />
        </span>
    );
}
