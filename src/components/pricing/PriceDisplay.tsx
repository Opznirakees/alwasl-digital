'use client';

import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

interface PriceDisplayProps {
  amountIqd: number;
  className?: string;
  primaryClassName?: string;
  secondaryClassName?: string;
  align?: 'start' | 'center' | 'end';
  compact?: boolean;
}

export function PriceDisplay({
  amountIqd,
  className,
  primaryClassName,
  secondaryClassName,
  align = 'start',
  compact = false,
}: PriceDisplayProps) {
  const { formatPriceOptions } = useApp();
  const prices = formatPriceOptions(amountIqd);
  if (!prices.length) return null;

  const alignment = align === 'center' ? 'items-center text-center' : align === 'end' ? 'items-end text-end' : 'items-start text-start';

  return (
    <span className={cn('flex min-w-0 flex-col', alignment, className)}>
      <span className={cn('font-semibold tabular-nums', primaryClassName)}>
        {prices[0].formatted}
      </span>
      {prices.length > 1 && (
        <span className={cn(
          'mt-0.5 flex flex-wrap gap-x-1.5 text-[10px] font-medium tabular-nums opacity-70',
          align === 'center' && 'justify-center',
          align === 'end' && 'justify-end',
          secondaryClassName
        )}>
          {prices.slice(1, compact ? 2 : undefined).map((price) => (
            <span key={price.code}>≈ {price.formatted}</span>
          ))}
        </span>
      )}
    </span>
  );
}
