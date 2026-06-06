import type { Metadata } from 'next';
import { ContactForm } from '@/app/(site)/contact/_components/ContactForm';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { COPY } from '@/lib/constants/copy';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/get-user';

export const metadata: Metadata = {
  title: COPY.contact.metaTitle,
  description: COPY.contact.metaDescription,
};

export default async function ContactPage() {
  // ログインユーザーは name / email を自動入力。匿名ユーザーは空のまま。
  // `getCurrentUser()` は React.cache 済みでリクエスト内で 1 回だけ Auth に問い合わせる。
  const user = await getCurrentUser();
  let defaultName: string | null = null;
  let defaultEmail: string | null = null;

  if (user) {
    defaultEmail = user.email ?? null;
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .is('deleted_at', null)
      .maybeSingle();
    defaultName = profile?.display_name ?? null;
  }

  return (
    <section className="mx-auto max-w-6xl px-6 pb-24 pt-8 md:pt-12">
      <header className="pb-8">
        <Breadcrumb
          className="mb-4"
          items={[{ label: COPY.nav.labels.home, href: '/' }, { label: COPY.contact.title }]}
        />
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-brand">
          {COPY.contact.eyebrow}
        </p>
        <h1 className="mt-3 font-serif text-4xl font-bold leading-[1.25] tracking-tight md:text-5xl">
          {COPY.contact.title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">
          {COPY.contact.description}
        </p>
      </header>

      <div className="max-w-2xl">
        <ContactForm
          defaultName={defaultName}
          defaultEmail={defaultEmail}
          emailLocked={Boolean(user)}
        />
      </div>
    </section>
  );
}
