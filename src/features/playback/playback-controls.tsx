import { Pause, Play, Square } from 'lucide-react';
import { Button } from '../../components/ui/button';

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
    <div className="playback-controls">
      <Button variant="ghost" onClick={onPlayPause}>
        {isPlaying ? <Pause size={15} strokeWidth={2} /> : <Play size={15} strokeWidth={2} />}
        <span>{isPlaying ? 'Pause' : 'Play'}</span>
      </Button>
      <Button variant="ghost" onClick={onStop}>
        <Square size={14} strokeWidth={2} />
        <span>Stop</span>
      </Button>
    </div>
  );
}
