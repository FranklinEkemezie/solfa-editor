/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import {
    applyThemeToDocument,
    readThemePreference,
    resolveTheme,
    systemPrefersDark,
    THEME_STORAGE_KEY,
    writeThemePreference,
} from '@/features/theme/theme';

describe('theme preference', () => {
    it('resolves system against the device', () => {
        expect(resolveTheme('system', true)).toBe('dark');
        expect(resolveTheme('system', false)).toBe('light');
        expect(resolveTheme('dark', false)).toBe('dark');
        expect(resolveTheme('light', true)).toBe('light');
    });

    it('reads a known preference and falls back to system', () => {
        const storage = {
            getItem: (key: string) => (key === THEME_STORAGE_KEY ? 'dark' : null),
        };
        expect(readThemePreference(storage)).toBe('dark');
        expect(readThemePreference({ getItem: () => 'sepia' })).toBe('system');
        expect(readThemePreference(null)).toBe('system');
    });

    it('writes the preference without throwing when storage refuses', () => {
        const written: string[] = [];
        writeThemePreference('light', {
            setItem: (key, value) => {
                written.push(`${key}:${value}`);
            },
        });
        expect(written).toEqual([`${THEME_STORAGE_KEY}:light`]);

        expect(() =>
            writeThemePreference('dark', {
                setItem: () => {
                    throw new Error('quota');
                },
            }),
        ).not.toThrow();
    });

    it('reads the system media query', () => {
        expect(systemPrefersDark({ matches: true })).toBe(true);
        expect(systemPrefersDark({ matches: false })).toBe(false);
        expect(systemPrefersDark(null)).toBe(false);
    });

    it('puts the theme and the browser chrome colour on the document', () => {
        document.head.innerHTML = '<meta name="theme-color" content="#000000">';
        const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

        applyThemeToDocument('dark', document.documentElement, document);
        expect(document.documentElement.dataset.theme).toBe('dark');
        expect(document.documentElement.style.colorScheme).toBe('dark');
        expect(meta?.content).toBe('#111914');

        applyThemeToDocument('light', document.documentElement, document);
        expect(document.documentElement.dataset.theme).toBe('light');
        expect(meta?.content).toBe('#f7f5ef');
    });
});
