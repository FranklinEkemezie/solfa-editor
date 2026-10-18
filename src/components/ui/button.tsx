import type { ButtonHTMLAttributes, ReactNode } from 'react';
import {
    BUTTON_SIZES,
    BUTTON_VARIANTS,
    type ButtonSize,
    type ButtonVariant,
} from '@/components/ui/button-styles';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
};

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    ...rest
}: ButtonProps) {
    const classes = `inline-flex items-center justify-center rounded-md transition ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`;
    return (
        <button className={classes} {...rest}>
            {children}
        </button>
    );
}
