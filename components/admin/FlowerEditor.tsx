'use client';

import { useActionState, useMemo, useState } from 'react';
import Link from 'next/link';
import { ImageGalleryManager } from '@/components/admin/ImageGalleryManager';
import { FlowerAliasManager } from '@/components/admin/FlowerAliasManager';
import { uploadFlowerImage } from '@/app/admin/flowers/upload-actions';
import { COPY } from '@/lib/constants/copy';
import type {
  FlowerAliasInput,
  FlowerImageInput,
  FlowerMutationInput,
} from '@/lib/queries/admin-flower-mutations';
import type { FlowerFormActionState } from '@/app/admin/flowers/actions';

const INPUT_CLASS =
  'w-full rounded-card border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-line-strong';

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

type Props = {
  initial: Partial<FlowerMutationInput> & { id?: string };
  action: (prev: FlowerFormActionState, formData: FormData) => Promise<FlowerFormActionState>;
  submitLabel: string;
  submittingLabel: string;
  cancelHref: string;
  cancelLabel: string;
};

export function FlowerEditor({
  initial,
  action,
  submitLabel,
  submittingLabel,
  cancelHref,
  cancelLabel,
}: Props) {
  const t = COPY.admin.flowers.editor;
  const errors = t.errors;

  const [name, setName] = useState(initial.name ?? '');
  const [nameKana, setNameKana] = useState(initial.nameKana ?? '');
  const [description, setDescription] = useState(initial.description ?? '');
  const [defaultSeasonStart, setDefaultSeasonStart] = useState<number | ''>(
    initial.defaultSeasonStart ?? '',
  );
  const [defaultSeasonEnd, setDefaultSeasonEnd] = useState<number | ''>(
    initial.defaultSeasonEnd ?? '',
  );
  const [images, setImages] = useState<FlowerImageInput[]>(initial.images ?? []);
  const [aliases, setAliases] = useState<FlowerAliasInput[]>(initial.aliases ?? []);

  const [state, formAction, pending] = useActionState<FlowerFormActionState, FormData>(
    action,
    null,
  );

  const errorMessage = useMemo(() => {
    if (!state?.error) return null;
    const base = errors[state.error];
    if (!base) return null;
    if (state.errorDetail && state.error.startsWith('alias_duplicate')) {
      return `${base}（${state.errorDetail}）`;
    }
    return base;
  }, [state, errors]);

  const imagesJson = useMemo(() => JSON.stringify(images), [images]);
  const aliasesJson = useMemo(() => JSON.stringify(aliases), [aliases]);

  return (
    <form action={formAction} className="mt-8 space-y-10">
      <input type="hidden" name="images_json" value={imagesJson} />
      <input type="hidden" name="aliases_json" value={aliasesJson} />

      {errorMessage && (
        <div
          role="alert"
          className="rounded-card border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {errorMessage}
        </div>
      )}

      <fieldset className="space-y-4">
        <legend className="font-serif text-lg font-semibold">{t.sectionBasics}</legend>
        <Field label={t.nameLabel} required>
          <input
            name="name"
            required
            className={INPUT_CLASS}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label={t.nameKanaLabel}>
          <input
            name="name_kana"
            className={INPUT_CLASS}
            value={nameKana}
            onChange={(e) => setNameKana(e.target.value)}
          />
        </Field>
        <Field label={t.descriptionLabel}>
          <textarea
            name="description"
            rows={4}
            className={INPUT_CLASS}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-serif text-lg font-semibold">{t.sectionSeason}</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t.defaultSeasonStartLabel}>
            <select
              name="default_season_start"
              className={INPUT_CLASS}
              value={defaultSeasonStart}
              onChange={(e) =>
                setDefaultSeasonStart(e.target.value === '' ? '' : Number(e.target.value))
              }
            >
              <option value="">{t.seasonNoneOption}</option>
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}月
                </option>
              ))}
            </select>
          </Field>
          <Field label={t.defaultSeasonEndLabel}>
            <select
              name="default_season_end"
              className={INPUT_CLASS}
              value={defaultSeasonEnd}
              onChange={(e) =>
                setDefaultSeasonEnd(e.target.value === '' ? '' : Number(e.target.value))
              }
            >
              <option value="">{t.seasonNoneOption}</option>
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}月
                </option>
              ))}
            </select>
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-serif text-lg font-semibold">{t.sectionAliases}</legend>
        <FlowerAliasManager
          value={aliases}
          onChange={setAliases}
          labels={{
            aliasLabel: t.aliasLabel,
            aliasPlaceholder: t.aliasPlaceholder,
            addAlias: t.addAlias,
            removeAlias: t.removeAlias,
            aliasEmpty: t.aliasEmpty,
          }}
        />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-serif text-lg font-semibold">{t.sectionImages}</legend>
        <ImageGalleryManager
          value={images}
          onChange={setImages}
          uploadAction={uploadFlowerImage}
          errors={errors}
          labels={{
            imageUrlLabel: t.imageUrlLabel,
            imageCaptionLabel: t.imageCaptionLabel,
            addImage: t.addImage,
            removeImage: t.removeImage,
            moveUp: t.moveUp,
            moveDown: t.moveDown,
            uploadButton: t.uploadButton,
            uploading: t.uploading,
            previewAlt: t.previewAlt,
            urlOrUploadHint: t.urlOrUploadHint,
          }}
        />
      </fieldset>

      <div className="flex items-center justify-between gap-3 pt-2">
        <Link
          href={cancelHref}
          className="rounded-pill border border-line bg-white px-5 py-2.5 text-sm transition hover:border-line-strong hover:bg-surface-2"
        >
          {cancelLabel}
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-pill bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:opacity-60"
        >
          {pending ? submittingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">
        {label}
        {required && <span className="ml-1 text-brand">*</span>}
      </span>
      {children}
    </label>
  );
}
