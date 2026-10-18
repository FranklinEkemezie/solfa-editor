import type { ComponentProps, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type IconButtonProps = ComponentProps<typeof Button> & {
    /** Tooltip text and accessible name for the button. */
    label: string;
    children: ReactNode;
};

/**
 * An icon-only button that reveals its meaning on hover or focus.
 *
 * Use this wherever a control relies on an icon alone (typically on small
 * screens) so the interface stays compact without losing discoverability.
 */
export function IconButton({ label, children, variant = 'icon', ...props }: IconButtonProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button aria-label={label} variant={variant} {...props}>
                    {children}
                </Button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
        </Tooltip>
    );
}
