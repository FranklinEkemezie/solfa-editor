import { useCallback, useEffect, useRef, useState } from 'react';
import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';
import { ScorePlayer } from '@/features/playback/score-player';

export function usePlayback(document: EditorDocument, onError: (message: string) => void) {
    const playerRef = useRef<ScorePlayer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeSlotId, setActiveSlotId] = useState<string | null>(null);

    useEffect(() => {
        return () => {
            playerRef.current?.dispose();
            playerRef.current = null;
        };
    }, []);

    const stop = useCallback(() => {
        playerRef.current?.stop();
        setIsPlaying(false);
        setActiveSlotId(null);
    }, []);

    const toggle = useCallback(async () => {
        if (isPlaying) {
            stop();
            return;
        }

        if (!playerRef.current) playerRef.current = new ScorePlayer();

        try {
            await playerRef.current.start(document, {
                onNoteStart: (event) => {
                    if (event.part === 'soprano') setActiveSlotId(event.slotId ?? null);
                },
                onPlaybackEnded: () => {
                    setIsPlaying(false);
                    setActiveSlotId(null);
                },
            });
            setIsPlaying(true);
        } catch (error) {
            onError(error instanceof Error ? error.message : 'Playback could not start.');
        }
    }, [document, isPlaying, onError, stop]);

    return { isPlaying, activeSlotId, toggle, stop };
}
