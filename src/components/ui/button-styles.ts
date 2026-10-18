export const BUTTON_VARIANTS = {
    primary: 'bg-green-dark text-white hover:bg-green-dark/90',
    secondary: 'bg-white border border-line text-ink hover:bg-gray-50',
    ghost: 'bg-transparent text-ink hover:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    icon: 'bg-transparent p-1 text-ink hover:bg-gray-100',
} as const;

export const BUTTON_SIZES = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2 text-base',
    lg: 'px-4 py-3 text-lg',
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;
export type ButtonSize = keyof typeof BUTTON_SIZES;
