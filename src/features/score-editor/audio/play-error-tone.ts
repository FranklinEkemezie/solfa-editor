export async function playErrorTone(): Promise<void> {
    try {
        const AudioContextConstructor =
            window.AudioContext ??
            (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextConstructor) return;

        const context = new AudioContextConstructor();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.frequency.value = 170;
        gain.gain.setValueAtTime(0.025, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.08);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.08);
        window.setTimeout(() => void context.close(), 150);
    } catch {
        // Audio feedback is optional and can be blocked by browser policy.
    }
}
