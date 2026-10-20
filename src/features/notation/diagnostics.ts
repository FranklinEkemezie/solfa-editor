import type { SourceRange } from '@/features/notation/source-position';

/** A failed parse, pointing at the source text that could not be understood. */
export type Diagnostic = {
    readonly message: string;
    readonly range: SourceRange;
};
