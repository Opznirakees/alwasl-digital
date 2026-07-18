'use client';

import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ChevronRight } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

export type LocalizedText = {
  en: string;
  ar: string;
  zh?: string;
};

type InfoSection = {
  title: LocalizedText;
  body?: LocalizedText;
  items?: LocalizedText[];
};

type InfoAction = {
  label: LocalizedText;
  href: string;
};

interface InfoPageProps {
  eyebrow: LocalizedText;
  title: LocalizedText;
  subtitle: LocalizedText;
  sections: InfoSection[];
  actions?: InfoAction[];
}

export function InfoPage({ eyebrow, title, subtitle, sections, actions = [] }: InfoPageProps) {
  const { t, dir } = useApp();
  const text = (value: LocalizedText) => t(value.en, value.ar, value.zh ?? value.en);

  return (
    <div className={`min-h-screen bg-[#f5f5f7] dark:bg-zinc-950 ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />

      <main className="container mx-auto max-w-5xl px-4 py-6 sm:py-10">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-zinc-500 hover:text-blue-700 dark:text-zinc-400 dark:hover:text-blue-300">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t('Back home', 'العودة للرئيسية', '返回首页')}
        </Link>

        <header className="mt-4 max-w-3xl">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{text(eyebrow)}</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-zinc-950 dark:text-white sm:text-4xl">{text(title)}</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300">{text(subtitle)}</p>

          {actions.length > 0 && (
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {actions.map((action, index) => {
                const className = cn(
                  'inline-flex min-h-12 items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950',
                  index === 0
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'border border-black/10 bg-white text-zinc-800 hover:bg-zinc-100 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-white/10'
                );
                const content = (
                  <>
                    {text(action.label)}
                    <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                  </>
                );

                if (action.href.startsWith('http')) {
                  return (
                    <a key={action.href} href={action.href} target="_blank" rel="noopener noreferrer" className={className}>
                      {content}
                    </a>
                  );
                }

                return (
                  <Link key={action.href} href={action.href} className={className}>
                    {content}
                  </Link>
                );
              })}
            </div>
          )}
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-2" aria-label={text(eyebrow)}>
          {sections.map((section) => (
            <article key={section.title.en} className="rounded-lg border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900 sm:p-6">
              <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">{text(section.title)}</h2>
              {section.body && (
                <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">{text(section.body)}</p>
              )}
              {section.items && (
                <ul className="mt-4 space-y-3">
                  {section.items.map((item) => (
                    <li key={item.en} className="flex gap-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-700 dark:text-blue-300" aria-hidden="true" />
                      <span>{text(item)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
