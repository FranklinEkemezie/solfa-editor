import { scoreDisplayTitle } from '@/domain/music';

/** A filesystem-friendly stem for a score's title. */
export function scoreFileStem(title: string): string {
    const slug = title
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 64);
    return slug || 'solfa-score';
}

export function scoreFileStemFor(document: { title: string }): string {
    return scoreFileStem(scoreDisplayTitle(document));
}

function triggerDownload(url: string, filename: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    link.style.display = 'none';
    document.body.append(link);
    link.click();
    link.remove();
}

export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    triggerDownload(url, filename);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadText(text: string, filename: string, type = 'text/plain'): void {
    downloadBlob(new Blob([text], { type }), filename);
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
    triggerDownload(dataUrl, filename);
}
