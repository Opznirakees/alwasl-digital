'use client';

import Link from 'next/link';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { useApp } from '@/contexts/AppContext';

type LocalizedText = {
  en: string;
  ar: string;
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
  const { t, dir, theme } = useApp();
  const isLight = theme === 'light';
  const text = (value: LocalizedText) => t(value.en, value.ar);

  return (
    <div className={`min-h-screen ${isLight ? 'bg-slate-50' : 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950'} ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />

      <main className="container mx-auto px-4 py-8 md:py-12">
        <Link href="/" className={`inline-flex items-center gap-2 text-sm mb-8 transition-colors ${isLight ? 'text-slate-600 hover:text-purple-600' : 'text-white/70 hover:text-white'}`}>
          <ArrowLeft className="w-4 h-4" />
          {t('Back to Home', 'العودة للرئيسية')}
        </Link>

        <section className="max-w-3xl">
          <p className={`text-sm font-semibold mb-3 ${isLight ? 'text-purple-600' : 'text-purple-300'}`}>
            {text(eyebrow)}
          </p>
          <h1 className={`text-3xl md:text-5xl font-bold leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {text(title)}
          </h1>
          <p className={`text-base md:text-lg mt-4 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
            {text(subtitle)}
          </p>

          {actions.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-8">
              {actions.map((action) => {
                const content = (
                  <>
                    {text(action.label)}
                    <ChevronRight className="w-4 h-4" />
                  </>
                );

                if (action.href.startsWith('http')) {
                  return (
                    <a
                      key={action.href}
                      href={action.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-lg shadow-purple-500/25"
                    >
                      {content}
                    </a>
                  );
                }

                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-lg shadow-purple-500/25"
                  >
                    {content}
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="grid md:grid-cols-2 gap-4 mt-10">
          {sections.map((section) => (
            <article
              key={section.title.en}
              className={`rounded-2xl border p-6 ${isLight ? 'bg-white border-purple-100 shadow-sm' : 'bg-slate-900/50 border-purple-500/15'}`}
            >
              <h2 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {text(section.title)}
              </h2>
              {section.body && (
                <p className={`text-sm leading-7 mt-3 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
                  {text(section.body)}
                </p>
              )}
              {section.items && (
                <ul className="space-y-3 mt-4">
                  {section.items.map((item) => (
                    <li key={item.en} className={`text-sm leading-6 ${isLight ? 'text-slate-600' : 'text-white/65'}`}>
                      {text(item)}
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
