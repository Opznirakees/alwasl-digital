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
    <div className={`v2-page ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />

      <main className="v2-container max-w-5xl py-6 pb-24 sm:py-10 lg:pb-16">
        <Link href="/" className="v2-ghost-link">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t('Back home', 'العودة للرئيسية', '返回首页')}
        </Link>

        <header className="v2-page-header mt-4">
          <p className="v2-kicker">{text(eyebrow)}</p>
          <h1>{text(title)}</h1>
          <p>{text(subtitle)}</p>

          {actions.length > 0 && (
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {actions.map((action, index) => {
                const className = cn(index === 0 ? 'v2-primary-button' : 'v2-secondary-button');
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
          {sections.map((section, index) => (
            <article key={section.title.en} className="v2-surface relative overflow-hidden p-5 sm:p-6">
              <span aria-hidden="true" className="absolute -end-4 -top-5 text-[4rem] font-black leading-none text-[var(--v2-navy-soft)] select-none">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h2 className="relative text-lg font-bold text-[var(--v2-navy)]">{text(section.title)}</h2>
              {section.body && (
                <p className="relative mt-3 text-sm leading-7 text-[var(--v2-muted)]">{text(section.body)}</p>
              )}
              {section.items && (
                <ul className="relative mt-4 space-y-3">
                  {section.items.map((item) => (
                    <li key={item.en} className="flex gap-3 text-sm leading-6 text-[var(--v2-muted)]">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--v2-gold-deep)]" aria-hidden="true" />
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
