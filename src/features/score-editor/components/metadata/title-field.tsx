import { Field } from '@/components/ui/field';
import { TextField } from '@/components/ui/text-field';
import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';
import { patchMetadata } from '@/features/score-editor/state/score-metadata-commands';

export function TitleField({
    document,
    onChange,
}: {
    document: EditorDocument;
    onChange: (next: EditorDocument) => void;
}) {
    return (
        <Field label="Title">
            <TextField
                value={document.title}
                onChange={(event) =>
                    onChange(patchMetadata(document, { title: event.target.value }))
                }
            />
        </Field>
    );
}
