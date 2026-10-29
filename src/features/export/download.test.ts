import { describe, expect, it } from 'vitest';
import { scoreFileStem, scoreFileStemFor } from '@/features/export/download';

describe('export file names', () => {
    it('makes a filesystem-safe stem from a title', () => {
        expect(scoreFileStem('Gloria — Sir Jude Nnam')).toBe('gloria-sir-jude-nnam');
        expect(scoreFileStem('  D major / 4-4  ')).toBe('d-major-4-4');
    });

    it('falls back for an empty title', () => {
        expect(scoreFileStem('')).toBe('solfa-score');
        expect(scoreFileStemFor({ title: '   ' })).toBe('untitled-sheet');
    });
});
