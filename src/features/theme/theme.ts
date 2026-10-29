/**
 * The editor's colour preference.
 *
 * A theme is a way of looking at the editor, not part of the score. It lives in
 * local storage beside the other device preferences and is deliberately kept
 * out of saved documents and `.solfa` files, so opening a score on another
 * machine does not impose the author's lighting on its reader.
 */
export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'solfa-theme';

export const THEME_OPTIONS: readonly {
    value: ThemePreference;
    label: string;
}[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
];

export function isThemePreference(value: unknown): value is ThemePreference {
    return value === 'light' || value === 'dark' || value === 'system';
}

/** The theme the interface should actually draw for a preference. */
export function resolveTheme(
    preference: ThemePreference,
    systemPrefersDark: boolean,
): ResolvedTheme {
    if (preference === 'system') return systemPrefersDark ? 'dark' : 'light';
    return preference;
}

type PreferenceStorage = Pick<Storage, 'getItem'>;

/** Read the device's preference, falling back to the system setting. */
export function readThemePreference(storage?: PreferenceStorage | null): ThemePreference {
    try {
        const stored = storage?.getItem(THEME_STORAGE_KEY);
        return isThemePreference(stored) ? stored : 'system';
    } catch {
        return 'system';
    }
}

type WritablePreferenceStorage = Pick<Storage, 'setItem'>;

export function writeThemePreference(
    preference: ThemePreference,
    storage?: WritablePreferenceStorage | null,
): void {
    try {
        storage?.setItem(THEME_STORAGE_KEY, preference);
    } catch {
        // A private window can refuse storage. The theme still applies for this
        // session; only remembering it is unavailable.
    }
}

/** Whether the operating system is currently asking for a dark interface. */
export function systemPrefersDark(
    media: Pick<MediaQueryList, 'matches'> | null | undefined = typeof window === 'undefined'
        ? null
        : window.matchMedia('(prefers-color-scheme: dark)'),
): boolean {
    return media?.matches ?? false;
}

const THEME_COLOUR: Record<ResolvedTheme, string> = {
    light: '#f7f5ef',
    dark: '#111914',
};

/**
 * Put the resolved theme on the document root.
 *
 * The root carries a `data-theme` attribute rather than a class so the CSS can
 * treat the editor's own palette and the printed sheet's fixed light palette as
 * two separate scopes.
 */
export function applyThemeToDocument(
    theme: ResolvedTheme,
    root: HTMLElement = document.documentElement,
    documentElement: Document = document,
): void {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;

    const meta = documentElement.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.content = THEME_COLOUR[theme];
}
