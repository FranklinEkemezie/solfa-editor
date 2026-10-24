import { NoteValue } from '@/domain/music';
import { cn } from '@/lib/utils';

const FLAGS: Partial<Record<NoteValue, number>> = {
    [NoteValue.EIGHTH]: 1,
    [NoteValue.SIXTEENTH]: 2,
    [NoteValue.THIRTY_SECOND]: 3,
    [NoteValue.SIXTY_FOURTH]: 4,
};

/**
 * A note value drawn as a music symbol.
 *
 * The app cannot rely on a music font being installed, so the glyph is a small
 * inline SVG: a hollow or filled note head, a stem, and one flag per beam for
 * the shorter values. It inherits `currentColor`, which lets the same symbol sit
 * in the masthead, in a form field, and in the printed heading.
 */
export function NoteValueGlyph({ value, className }: { value: NoteValue; className?: string }) {
    const hollow = value === NoteValue.WHOLE || value === NoteValue.HALF;
    const flags = FLAGS[value] ?? 0;

    return (
        <svg
            viewBox="0 0 24 32"
            className={cn('inline-block shrink-0', className)}
            aria-hidden="true"
            focusable="false"
        >
            {value === NoteValue.WHOLE ? (
                <ellipse
                    cx="12"
                    cy="20"
                    rx="8"
                    ry="5.2"
                    transform="rotate(-12 12 20)"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                />
            ) : (
                <>
                    <ellipse
                        cx="8.5"
                        cy="24"
                        rx="5.4"
                        ry="3.9"
                        transform="rotate(-20 8.5 24)"
                        fill={hollow ? 'none' : 'currentColor'}
                        stroke="currentColor"
                        strokeWidth={hollow ? 1.8 : 0}
                    />
                    <line
                        x1="13"
                        y1="22.8"
                        x2="13"
                        y2="4"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                    />
                    {flags > 0
                        ? Array.from({ length: flags }, (_, index) => (
                              <path
                                  key={index}
                                  d="M13 4 C18.5 5.2 20 8.8 16.6 12.4 C17.8 9.2 16.4 6.8 13 6.1 Z"
                                  fill="currentColor"
                                  transform={`translate(0 ${index * 3.2})`}
                              />
                          ))
                        : null}
                </>
            )}
        </svg>
    );
}
