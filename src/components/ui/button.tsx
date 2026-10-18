import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';
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

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ children, variant = 'primary', size = 'md', className = '', ...rest }, ref) => {
        const classes = `inline-flex items-center justify-center rounded-md transition ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`;
        return (
            <button ref={ref} className={classes} {...rest}>
                {children}
            </button>
        );
    },
);

Button.displayName = 'Button';
