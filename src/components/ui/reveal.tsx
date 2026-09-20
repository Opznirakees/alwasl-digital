'use client';

import { useEffect, useRef, type ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: 'div' | 'section';
  /** Extra props such as aria attributes are forwarded to the wrapper. */
  [key: string]: unknown;
}

/**
 * Fades and lifts its children into view the first time they enter the viewport.
 * Purely decorative: content is always in the DOM and reduced-motion users see it immediately.
 */
export function Reveal({ children, className, delay = 0, as = 'div', ...rest }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      node.setAttribute('data-revealed', 'true');
      return;
    }
    const reveal = () => {
      node.setAttribute('data-revealed', 'true');
      observer.disconnect();
      window.clearTimeout(fallback);
    };
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) reveal();
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    // Never leave content hidden: reveal after a short grace period even without scrolling.
    const fallback = window.setTimeout(reveal, 700);
    observer.observe(node);
    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  const Tag = as;
  return (
    <Tag ref={ref} data-reveal className={className} style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties} {...rest}>
      {children}
    </Tag>
  );
}
