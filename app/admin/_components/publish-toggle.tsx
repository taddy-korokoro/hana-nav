'use client';

import { useTransition } from 'react';
import { Switch } from '@/components/ui/switch';
import { togglePublishedAction } from '@/app/admin/spots/actions';

type Props = {
  spotId: string;
  isPublished: boolean;
  publishedLabel: string;
  unpublishedLabel: string;
};

/**
 * 公開フラグのトグルスイッチ。Switch が変化したら Server Action を transition で呼ぶ。
 * `revalidatePath` が走るので、サーバー側の真値が次の re-render で反映される。
 */
export function PublishToggle({ spotId, isPublished, publishedLabel, unpublishedLabel }: Props) {
  const [pending, startTransition] = useTransition();

  const handleChange = (next: boolean) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set('spot_id', spotId);
      formData.set('next', next ? 'true' : 'false');
      await togglePublishedAction(formData);
    });
  };

  return (
    <label className="inline-flex items-center gap-2 text-xs">
      <Switch checked={isPublished} disabled={pending} onCheckedChange={handleChange} />
      <span className={isPublished ? 'text-brand' : 'text-ink-muted'}>
        {isPublished ? publishedLabel : unpublishedLabel}
      </span>
    </label>
  );
}
