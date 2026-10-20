import { useCallback, useEffect, useRef, useState } from 'react';
import type { ScoreView } from '@/features/score-editor/model/score-view';
import { ScorePlayer } from '@/features/playback/score-player';

export function usePlayback(view: ScoreView, onError: (message: string) => void) {
    const playerRef = useRef<ScorePlayer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeNoteKey, setActiveNoteKey] = useState<string | null>(null);

    useEffect(() => {
        return () => {
            playerRef.current?.dispose();
            playerRef.current = null;
        };
    }, []);

    const stop = useCallback(() => {
        playerRef.current?.stop();
        setIsPlaying(false);
        setActiveNoteKey(null);
    }, []);

    const toggle = useCallback(async () => {
        if (isPlaying) {
            stop();
            return;
        }

        if (!playerRef.current) playerRef.current = new ScorePlayer();

        try {
            await playerRef.current.start(view, {
                onNoteStart: (event) => {
                    if (event.part === 'soprano') setActiveNoteKey(event.noteKey);
                },
                onPlaybackEnded: () => {
                    setIsPlaying(false);
                    setActiveNoteKey(null);
                },
            });
            setIsPlaying(true);
        } catch (error) {
            onError(error instanceof Error ? error.message : 'Playback could not start.');
        }
    }, [isPlaying, onError, stop, view]);

    return { isPlaying, activeNoteKey, toggle, stop };
}
