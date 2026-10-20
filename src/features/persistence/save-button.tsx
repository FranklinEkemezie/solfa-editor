import { Loader2, Save } from 'lucide-react';
import { IconButton } from '@/components/ui/icon-button';

/**
 * The explicit save action that sits beside the playback controls.
 *
 * Autosave already keeps the score current, but a visible Save gives the
 * writer a way to say "now" and to see that the browser is working. The label
 * folds away on small screens in the same way the playback labels do.
 */
export function SaveButton({
    onSave,
    isSaving,
    disabled,
}: {
    onSave: () => void;
    isSaving: boolean;
    disabled?: boolean;
}) {
    return (
        <IconButton
            label={isSaving ? 'Saving score' : 'Save score'}
            variant="ghost"
            onClick={onSave}
            disabled={disabled}
            className="gap-2"
        >
            {isSaving ? (
                <Loader2 size={15} strokeWidth={2} className="animate-spin" />
            ) : (
                <Save size={15} strokeWidth={2} />
            )}
            <span className="hidden sm:inline">{isSaving ? 'Saving' : 'Save'}</span>
        </IconButton>
    );
}
