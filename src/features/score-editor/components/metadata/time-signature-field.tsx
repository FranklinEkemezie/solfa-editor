import { type NoteValue } from '@/domain/music';
import { Field } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import type { EditorDocument } from '@/features/score-editor/adapters/editor-document-schema';
import { TIME_SIGNATURE_OPTIONS } from '@/features/score-editor/components/metadata/metadata-options';
import {
    makeTimeSignature,
    patchMetadata,
} from '@/features/score-editor/state/score-metadata-commands';

export function TimeSignatureField({
    document,
    onChange,
}: {
    document: EditorDocument;
    onChange: (next: EditorDocument) => void;
}) {
    const { count, note } = document.timeSignature;

    return (
        <Field label="Time">
            <Select
                value={`${count}/${note}`}
                onChange={(event) => {
                    const [nextCount, nextNote] = event.target.value.split('/');
                    onChange(
                        patchMetadata(document, {
                            timeSignature: makeTimeSignature(
                                nextNote as NoteValue,
                                Number(nextCount),
                            ),
                        }),
                    );
                }}
                options={TIME_SIGNATURE_OPTIONS}
            />
        </Field>
    );
}
