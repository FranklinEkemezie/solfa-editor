import { Pause, Play, Square } from 'lucide-react';
import { IconButton } from '@/components/ui/icon-button';

export function PlaybackControls({
    isPlaying,
    onPlayPause,
    onStop,
}: {
    isPlaying: boolean;
    onPlayPause: () => void;
    onStop: () => void;
}) {
    return (
        <div className="flex items-center gap-2">
            <IconButton
                label={isPlaying ? 'Pause' : 'Play'}
                variant="ghost"
                onClick={onPlayPause}
                className="gap-2"
            >
                {isPlaying ? (
                    <Pause size={15} strokeWidth={2} />
                ) : (
                    <Play size={15} strokeWidth={2} />
                )}
                <span className="hidden sm:inline">{isPlaying ? 'Pause' : 'Play'}</span>
            </IconButton>
            <IconButton label="Stop" variant="ghost" onClick={onStop} className="gap-2">
                <Square size={14} strokeWidth={2} />
                <span className="hidden sm:inline">Stop</span>
            </IconButton>
        </div>
    );
}
