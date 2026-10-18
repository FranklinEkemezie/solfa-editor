import { Accidental, Letter, Mode } from '@/domain/music';
import { Field } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';
import { KEY_OPTIONS } from '@/features/score-editor/components/metadata/metadata-options';
import { makeKey, patchMetadata } from '@/features/score-editor/state/score-metadata-commands';

export function KeyField({
    document,
    onChange,
}: {
    document: EditorDocument;
    onChange: (next: EditorDocument) => void;
}) {
    const { letter, mode, signature } = document.key;

    return (
        <Field label="Key">
            <Select
                value={`${letter}-${mode}-${signature.accidental}-${signature.count}`}
                onChange={(event) => {
                    const [nextLetter, nextMode, accidental, count] = event.target.value.split('-');
                    onChange(
                        patchMetadata(document, {
                            key: makeKey(
                                nextLetter as Letter,
                                nextMode as Mode,
                                accidental as Accidental,
                                Number(count),
                            ),
                        }),
                    );
                }}
                options={KEY_OPTIONS}
            />
        </Field>
    );
}
