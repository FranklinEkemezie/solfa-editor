import { Field } from '@/components/ui/field';
import { TextField } from '@/components/ui/text-field';
import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';
import { patchMetadata } from '@/features/score-editor/state/score-metadata-commands';

export function AuthorField({
    document,
    onChange,
}: {
    document: EditorDocument;
    onChange: (next: EditorDocument) => void;
}) {
    return (
        <Field label="Author">
            <TextField
                value={document.author}
                onChange={(event) =>
                    onChange(patchMetadata(document, { author: event.target.value }))
                }
            />
        </Field>
    );
}
