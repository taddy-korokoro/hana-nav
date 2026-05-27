import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AvatarUploader } from '@/components/mypage/AvatarUploader';
import { ProfileForm } from '@/components/mypage/ProfileForm';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { FormBanner } from '@/components/ui/form-banner';
import { COPY } from '@/lib/constants/copy';
import { getMyProfile } from '@/lib/queries/mypage';
import { requireUser } from '@/lib/utils/requireUser';


export const metadata: Metadata = {
  title: COPY.mypage.profile.metaTitle,
};

export default async function MyProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; status?: string }>;
}) {
  const [user, params] = await Promise.all([requireUser(), searchParams]);
  const profile = await getMyProfile(user.id);
  if (!profile) {
    notFound();
  }

  const errorMessage = params.error ? COPY.mypage.profile.errors[params.error] : null;
  const successMessage = params.status === 'updated' ? COPY.mypage.profile.success : null;

  const fallback = (profile.username ?? user.email ?? 'U').slice(0, 1).toUpperCase();
  const initialUsername = profile.username ?? '';

  return (
    <section className="mx-auto max-w-6xl px-6 pb-24 pt-8 md:pt-12">
      <header className="pb-2">
        <Breadcrumb
          className="mb-4"
          items={[
            { label: COPY.nav.labels.home, href: '/' },
            { label: COPY.mypage.top.title, href: '/mypage' },
            { label: COPY.mypage.profile.title },
          ]}
        />
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">
          {COPY.mypage.profile.eyebrow}
        </p>
        <h1 className="mt-3 font-serif text-3xl font-bold leading-[1.25] tracking-tight md:text-4xl">
          {COPY.mypage.profile.title}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-7 text-ink-muted">
          {COPY.mypage.profile.description}
        </p>
        <Link
          href="/mypage"
          className="mt-4 inline-flex items-center text-sm text-ink-muted hover:text-brand"
        >
          ← {COPY.mypage.profile.backToMypage}
        </Link>
      </header>

      <div className="max-w-2xl">
        {successMessage && (
          <div className="mt-6">
            <FormBanner variant="success">{successMessage}</FormBanner>
          </div>
        )}
        {errorMessage && (
          <div className="mt-6">
            <FormBanner variant="error">{errorMessage}</FormBanner>
          </div>
        )}

        <div className="mt-8 rounded-card-lg bg-white p-6 sm:p-8">
          <AvatarUploader
            userId={user.id}
            initialUrl={profile.avatarUrl}
            initialFallback={fallback}
          />
        </div>

        <div className="mt-6 rounded-card-lg bg-white p-6 sm:p-8">
          <ProfileForm initialUsername={initialUsername} />
        </div>
      </div>
    </section>
  );
}
