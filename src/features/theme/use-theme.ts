import { useCallback, useEffect, useState } from 'react';
import {
    applyThemeToDocument,
    readThemePreference,
    resolveTheme,
    systemPrefersDark,
    writeThemePreference,
    type ResolvedTheme,
    type ThemePreference,
} from '@/features/theme/theme';

function preferenceStorage(): Storage | null {
    try {
        return window.localStorage;
    } catch {
        return null;
    }
}

function darkMedia(): MediaQueryList | null {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
    return window.matchMedia('(prefers-color-scheme: dark)');
}

/**
 * Keep the chosen theme in step with the device.
 *
 * The choice is read once, before the first paint when the inline boot script
 * in `index.html` has already applied it. A `system` preference follows the
 * operating system live; choosing Light or Dark stops listening to it until
 * the writer returns to System.
 */
export function useTheme(): {
    preference: ThemePreference;
    resolved: ResolvedTheme;
    setPreference: (preference: ThemePreference) => void;
} {
    const [preference, setPreferenceState] = useState<ThemePreference>(() =>
        readThemePreference(preferenceStorage()),
    );
    const [systemDark, setSystemDark] = useState(() => systemPrefersDark(darkMedia()));

    useEffect(() => {
        const media = darkMedia();
        if (!media) return undefined;

        const update = (event: MediaQueryListEvent) => setSystemDark(event.matches);
        setSystemDark(media.matches);

        if (typeof media.addEventListener === 'function') {
            media.addEventListener('change', update);
            return () => media.removeEventListener('change', update);
        }

        // Safari before 14 only has the deprecated listener API.
        media.addListener(update);
        return () => media.removeListener(update);
    }, []);

    const resolved = resolveTheme(preference, systemDark);

    useEffect(() => {
        applyThemeToDocument(resolved);
    }, [resolved]);

    const setPreference = useCallback((next: ThemePreference) => {
        setPreferenceState(next);
        writeThemePreference(next, preferenceStorage());
    }, []);

    return { preference, resolved, setPreference };
}
