'use client';

import { useActionState, useMemo, useState } from 'react';
import Link from 'next/link';
import { COPY } from '@/lib/constants/copy';
import type {
  SpotFlowerInput,
  SpotImageInput,
  SpotMutationInput,
} from '@/lib/queries/admin-spot-mutations';
import type { FormActionState } from '@/app/admin/spots/actions';
import { CoordinatePicker } from './CoordinatePicker';

const INPUT_CLASS =
  'w-full rounded-card border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-line-strong focus:ring-2 focus:ring-brand/20';

type PrefectureOption = { id: number; name: string; region: string };
type FlowerOption = { id: string; name: string };

type Props = {
  initial: Partial<SpotMutationInput> & { id?: string };
  prefectures: PrefectureOption[];
  flowers: FlowerOption[];
  mapsApiKey: string | undefined;
  action: (prev: FormActionState, formData: FormData) => Promise<FormActionState>;
  submitLabel: string;
  submittingLabel: string;
  cancelHref: string;
  cancelLabel: string;
};

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export function SpotEditor({
  initial,
  prefectures,
  flowers,
  mapsApiKey,
  action,
  submitLabel,
  submittingLabel,
  cancelHref,
  cancelLabel,
}: Props) {
  const t = COPY.admin.spots.editor;
  const errors = t.errors;

  const [name, setName] = useState(initial.name ?? '');
  const [nameKana, setNameKana] = useState(initial.nameKana ?? '');
  const [description, setDescription] = useState(initial.description ?? '');
  const [prefectureId, setPrefectureId] = useState(initial.prefectureId ?? 0);
  const [location, setLocation] = useState(initial.location ?? '');
  const [latitude, setLatitude] = useState<number | ''>(
    initial.latitude != null ? Number(initial.latitude) : '',
  );
  const [longitude, setLongitude] = useState<number | ''>(
    initial.longitude != null ? Number(initial.longitude) : '',
  );
  const [bestSeasonStart, setBestSeasonStart] = useState(initial.bestSeasonStart ?? 1);
  const [bestSeasonEnd, setBestSeasonEnd] = useState(initial.bestSeasonEnd ?? 12);
  const [officialUrl, setOfficialUrl] = useState(initial.officialUrl ?? '');
  const [source, setSource] = useState(initial.source ?? '');
  const [accessInfo, setAccessInfo] = useState(initial.accessInfo ?? '');
  const [parkingInfo, setParkingInfo] = useState(initial.parkingInfo ?? '');
  const [entranceFee, setEntranceFee] = useState(initial.entranceFee ?? '');
  const [isPublished, setIsPublished] = useState(initial.isPublished ?? false);
  const [images, setImages] = useState<SpotImageInput[]>(initial.images ?? []);
  const [spotFlowers, setSpotFlowers] = useState<SpotFlowerInput[]>(initial.flowers ?? []);

  const [state, formAction, pending] = useActionState<FormActionState, FormData>(action, null);

  const errorMessage = state?.error ? errors[state.error] : null;

  const imagesJson = useMemo(() => JSON.stringify(images), [images]);
  const flowersJson = useMemo(() => JSON.stringify(spotFlowers), [spotFlowers]);

  const flowersById = useMemo(() => new Map(flowers.map((f) => [f.id, f.name])), [flowers]);

  return (
    <form action={formAction} className="mt-8 space-y-10">
      {/* hidden serialized arrays */}
      <input type="hidden" name="images_json" value={imagesJson} />
      <input type="hidden" name="flowers_json" value={flowersJson} />

      {errorMessage && (
        <div
          role="alert"
          className="rounded-card border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {errorMessage}
        </div>
      )}

      {/* Basics */}
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

      {/* Location */}
      <fieldset className="space-y-4">
        <legend className="font-serif text-lg font-semibold">{t.sectionLocation}</legend>

        <Field label={t.prefectureLabel} required>
          <select
            name="prefecture_id"
            required
            className={INPUT_CLASS}
            value={prefectureId}
            onChange={(e) => setPrefectureId(Number(e.target.value))}
          >
            <option value={0}>—</option>
            {prefectures.map((p) => (
              <option key={p.id} value={p.id}>
                {p.region} / {p.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t.locationLabel} required>
          <input
            name="location"
            required
            className={INPUT_CLASS}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t.latitudeLabel} required>
            <input
              name="latitude"
              type="number"
              step="0.000001"
              required
              className={INPUT_CLASS}
              value={latitude}
              onChange={(e) => setLatitude(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </Field>
          <Field label={t.longitudeLabel} required>
            <input
              name="longitude"
              type="number"
              step="0.000001"
              required
              className={INPUT_CLASS}
              value={longitude}
              onChange={(e) => setLongitude(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </Field>
        </div>
        <CoordinatePicker
          apiKey={mapsApiKey}
          initialLatitude={typeof latitude === 'number' ? latitude : null}
          initialLongitude={typeof longitude === 'number' ? longitude : null}
          onChange={(lat, lng) => {
            setLatitude(Number(lat.toFixed(6)));
            setLongitude(Number(lng.toFixed(6)));
          }}
        />
      </fieldset>

      {/* Season */}
      <fieldset className="space-y-4">
        <legend className="font-serif text-lg font-semibold">{t.sectionSeason}</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t.bestSeasonStartLabel} required>
            <select
              name="best_season_start"
              className={INPUT_CLASS}
              value={bestSeasonStart}
              onChange={(e) => setBestSeasonStart(Number(e.target.value))}
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}月
                </option>
              ))}
            </select>
          </Field>
          <Field label={t.bestSeasonEndLabel} required>
            <select
              name="best_season_end"
              className={INPUT_CLASS}
              value={bestSeasonEnd}
              onChange={(e) => setBestSeasonEnd(Number(e.target.value))}
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}月
                </option>
              ))}
            </select>
          </Field>
        </div>
      </fieldset>

      {/* Meta */}
      <fieldset className="space-y-4">
        <legend className="font-serif text-lg font-semibold">{t.sectionMeta}</legend>
        <Field label={t.officialUrlLabel}>
          <input
            name="official_url"
            type="url"
            className={INPUT_CLASS}
            value={officialUrl}
            onChange={(e) => setOfficialUrl(e.target.value)}
          />
        </Field>
        <Field label={t.sourceLabel}>
          <input
            name="source"
            className={INPUT_CLASS}
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
        </Field>
        <Field label={t.accessLabel}>
          <textarea
            name="access_info"
            rows={2}
            className={INPUT_CLASS}
            value={accessInfo}
            onChange={(e) => setAccessInfo(e.target.value)}
          />
        </Field>
        <Field label={t.parkingLabel}>
          <textarea
            name="parking_info"
            rows={2}
            className={INPUT_CLASS}
            value={parkingInfo}
            onChange={(e) => setParkingInfo(e.target.value)}
          />
        </Field>
        <Field label={t.feeLabel}>
          <input
            name="entrance_fee"
            className={INPUT_CLASS}
            value={entranceFee}
            onChange={(e) => setEntranceFee(e.target.value)}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_published"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="size-4 rounded border-line"
          />
          <span>
            {isPublished
              ? COPY.admin.spots.edit.publishToggleOn
              : COPY.admin.spots.edit.publishToggleOff}
          </span>
        </label>
      </fieldset>

      {/* Images */}
      <fieldset className="space-y-4">
        <legend className="font-serif text-lg font-semibold">{t.sectionImages}</legend>
        <div className="space-y-3">
          {images.map((img, idx) => (
            <div key={`${idx}-${img.url}`} className="rounded-card border border-line bg-white p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
                <div className="space-y-3">
                  <Field label={t.imageUrlLabel}>
                    <input
                      type="url"
                      className={INPUT_CLASS}
                      value={img.url}
                      onChange={(e) =>
                        setImages((cur) =>
                          cur.map((it, i) => (i === idx ? { ...it, url: e.target.value } : it)),
                        )
                      }
                    />
                  </Field>
                  <Field label={t.imageCaptionLabel}>
                    <input
                      className={INPUT_CLASS}
                      value={img.caption ?? ''}
                      onChange={(e) =>
                        setImages((cur) =>
                          cur.map((it, i) => (i === idx ? { ...it, caption: e.target.value } : it)),
                        )
                      }
                    />
                  </Field>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <button
                    type="button"
                    className="rounded-pill border border-line bg-white px-3 py-1 text-xs disabled:opacity-40"
                    disabled={idx === 0}
                    onClick={() =>
                      setImages((cur) => {
                        if (idx === 0) return cur;
                        const next = [...cur];
                        [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                        return next.map((v, i) => ({ ...v, displayOrder: i }));
                      })
                    }
                  >
                    {t.moveUp}
                  </button>
                  <button
                    type="button"
                    className="rounded-pill border border-line bg-white px-3 py-1 text-xs disabled:opacity-40"
                    disabled={idx === images.length - 1}
                    onClick={() =>
                      setImages((cur) => {
                        if (idx === cur.length - 1) return cur;
                        const next = [...cur];
                        [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                        return next.map((v, i) => ({ ...v, displayOrder: i }));
                      })
                    }
                  >
                    {t.moveDown}
                  </button>
                  <button
                    type="button"
                    className="rounded-pill border border-destructive/30 bg-white px-3 py-1 text-xs text-destructive"
                    onClick={() =>
                      setImages((cur) =>
                        cur.filter((_, i) => i !== idx).map((v, i) => ({ ...v, displayOrder: i })),
                      )
                    }
                  >
                    {t.removeImage}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="rounded-pill border border-line bg-white px-4 py-2 text-sm"
          onClick={() =>
            setImages((cur) => [...cur, { url: '', caption: '', displayOrder: cur.length }])
          }
        >
          {t.addImage}
        </button>
      </fieldset>

      {/* Flowers */}
      <fieldset className="space-y-4">
        <legend className="font-serif text-lg font-semibold">{t.sectionFlowers}</legend>
        <div className="space-y-3">
          {spotFlowers.map((f, idx) => (
            <div key={idx} className="rounded-card border border-line bg-white p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto_auto]">
                <Field label={t.flowerSelectLabel}>
                  <select
                    className={INPUT_CLASS}
                    value={f.flowerId}
                    onChange={(e) =>
                      setSpotFlowers((cur) =>
                        cur.map((it, i) => (i === idx ? { ...it, flowerId: e.target.value } : it)),
                      )
                    }
                  >
                    <option value="">—</option>
                    {flowers.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t.flowerBloomStartLabel}>
                  <select
                    className={INPUT_CLASS}
                    value={f.bloomStartMonth ?? ''}
                    onChange={(e) =>
                      setSpotFlowers((cur) =>
                        cur.map((it, i) =>
                          i === idx
                            ? {
                                ...it,
                                bloomStartMonth:
                                  e.target.value === '' ? null : Number(e.target.value),
                              }
                            : it,
                        ),
                      )
                    }
                  >
                    <option value="">—</option>
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t.flowerBloomEndLabel}>
                  <select
                    className={INPUT_CLASS}
                    value={f.bloomEndMonth ?? ''}
                    onChange={(e) =>
                      setSpotFlowers((cur) =>
                        cur.map((it, i) =>
                          i === idx
                            ? {
                                ...it,
                                bloomEndMonth:
                                  e.target.value === '' ? null : Number(e.target.value),
                              }
                            : it,
                        ),
                      )
                    }
                  >
                    <option value="">—</option>
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="flex flex-col justify-end">
                  <button
                    type="button"
                    className="rounded-pill border border-destructive/30 bg-white px-3 py-1 text-xs text-destructive"
                    onClick={() => setSpotFlowers((cur) => cur.filter((_, i) => i !== idx))}
                  >
                    {t.removeFlower}
                  </button>
                </div>
              </div>
              {f.flowerId && (
                <p className="mt-1 text-xs text-ink-faint">{flowersById.get(f.flowerId) ?? ''}</p>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          className="rounded-pill border border-line bg-white px-4 py-2 text-sm"
          onClick={() =>
            setSpotFlowers((cur) => [
              ...cur,
              { flowerId: '', bloomStartMonth: null, bloomEndMonth: null },
            ])
          }
        >
          {t.addFlower}
        </button>
      </fieldset>

      <div className="flex items-center justify-between gap-3 pt-2">
        <Link
          href={cancelHref}
          className="rounded-pill border border-line bg-white px-5 py-2.5 text-sm"
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
