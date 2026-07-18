import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import {
  checkoutSteps,
  getCheckoutStepState,
  getInitialPackageId,
  getOrderStatusGuidance,
  getSafeInternalReturnPath,
} from '../src/lib/easy-use';

const repoRoot = join(import.meta.dir, '..');
const read = (path: string) => readFileSync(join(repoRoot, path), 'utf8');

describe('generation 2 easy-use rules', () => {
  it('preselects only an available package with an exact amount match', () => {
    const packages = [
      { id: 'five', amount: 5000, inStock: true },
      { id: 'ten', amount: 10000, inStock: true },
      { id: 'sold-out', amount: 25000, inStock: false },
    ];

    expect(getInitialPackageId(packages, '10000')).toBe('ten');
    expect(getInitialPackageId(packages, '25000')).toBeNull();
    expect(getInitialPackageId(packages, '10000abc')).toBeNull();
    expect(getInitialPackageId(packages, null)).toBeNull();
  });

  it('keeps login return paths internal and preserves checkout context', () => {
    expect(getSafeInternalReturnPath('/top-up/waho-top-up?amount=25000')).toBe('/top-up/waho-top-up?amount=25000');
    expect(getSafeInternalReturnPath('https://example.com/steal')).toBe('/');
    expect(getSafeInternalReturnPath('//example.com/steal')).toBe('/');
    expect(getSafeInternalReturnPath('/\\example.com/steal')).toBe('/');
    expect(getSafeInternalReturnPath(null, '/top-up/waho-top-up')).toBe('/top-up/waho-top-up');
  });

  it('gives every checkout stage a plain-language label in all languages', () => {
    expect(checkoutSteps).toHaveLength(4);
    expect(checkoutSteps.map((step) => step.id)).toEqual(['package', 'details', 'payment', 'confirm']);

    for (const step of checkoutSteps) {
      expect(step.label.en.length).toBeGreaterThan(2);
      expect(step.label.ar.length).toBeGreaterThan(2);
      expect(step.label.zh.length).toBeGreaterThan(0);
    }

    expect(getCheckoutStepState('details', 'package')).toBe('complete');
    expect(getCheckoutStepState('details', 'details')).toBe('current');
    expect(getCheckoutStepState('details', 'payment')).toBe('upcoming');
  });

  it('explains order statuses with a next action instead of color alone', () => {
    expect(getOrderStatusGuidance('pending', 'en')).toContain('payment');
    expect(getOrderStatusGuidance('processing', 'ar')).not.toBe('processing');
    expect(getOrderStatusGuidance('failed', 'zh').length).toBeGreaterThan(4);
    expect(getOrderStatusGuidance('completed', 'en')).toContain('WAHO');
  });

  it('removes dead customer actions and old conflicting color systems', () => {
    const customerPages = [
      'src/app/orders/page.tsx',
      'src/app/wallet/page.tsx',
      'src/app/profile/page.tsx',
      'src/app/settings/page.tsx',
      'src/components/info/InfoPage.tsx',
    ].map(read).join('\n');

    expect(customerPages).not.toMatch(/from-purple|to-pink|purple-500|from-emerald-500|to-teal-600/);
    expect(read('src/app/orders/page.tsx')).not.toContain("t('View Details'");
    expect(read('src/app/orders/page.tsx')).not.toContain("t('Reorder'");
    expect(read('src/app/wallet/page.tsx')).not.toContain("t('View All'");
  });

  it('keeps core mobile navigation and named wizard steps visible', () => {
    const header = read('src/components/layout/Header.tsx');
    const wizard = read('src/app/top-up/[slug]/page.tsx');

    expect(header).toContain('data-mobile-tab-bar');
    expect(header).toContain('aria-current');
    expect(wizard).toContain('checkoutSteps');
    expect(wizard).toContain('useSearchParams');
    expect(wizard).toContain('focus');
  });

  it('restores checkout details after WhatsApp login and keeps field errors visible', () => {
    const wizard = read('src/app/top-up/[slug]/page.tsx');

    expect(wizard).toContain('alwasl-pending-checkout');
    expect(wizard).toContain('resume=1');
    expect(wizard).toContain("setStep('details')");
    expect(wizard).toContain('aria-invalid={Boolean(wahoIdError)}');
    expect(wizard).toContain('role="alert"');
  });

  it('does not flash logged-out screens while the saved session is still loading', () => {
    const context = read('src/contexts/AppContext.tsx');
    const accountPages = [
      'src/app/orders/page.tsx',
      'src/app/wallet/page.tsx',
      'src/app/profile/page.tsx',
    ].map(read);

    expect(context).toContain('isAccountLoading');
    expect(context).toContain('ACCOUNT_REQUEST_TIMEOUT');
    for (const page of accountPages) {
      expect(page).toContain('isAccountLoading');
      expect(page).toContain('<AccountPageLoading />');
    }
  });

  it('documents measurable UX acceptance criteria', () => {
    const plan = read('easy-use.md');

    expect(plan).toContain('Generatie 2 uitgangspunten');
    expect(plan).toContain('Touch targets zijn minimaal 44 bij 44 pixels');
    expect(plan).toContain('Engels, Arabisch en Chinees');
    expect(plan).toContain('Playwright');
  });

  it('keeps customer-facing English, Arabic and Chinese copy complete', () => {
    const customerFiles = [
      'src/app/about/page.tsx',
      'src/app/auth/page.tsx',
      'src/app/cart/page.tsx',
      'src/app/contact/page.tsx',
      'src/app/faq/page.tsx',
      'src/app/help/page.tsx',
      'src/app/orders/page.tsx',
      'src/app/page.tsx',
      'src/app/privacy/page.tsx',
      'src/app/profile/page.tsx',
      'src/app/promotions/page.tsx',
      'src/app/settings/page.tsx',
      'src/app/terms/page.tsx',
      'src/app/top-up/page.tsx',
      'src/app/top-up/[slug]/page.tsx',
      'src/app/wallet/page.tsx',
      'src/components/home/HeroBanner.tsx',
      'src/components/info/InfoPage.tsx',
      'src/components/layout/Header.tsx',
    ];
    const failures: string[] = [];

    for (const file of customerFiles) {
      const source = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const visit = (node: ts.Node) => {
        if (
          ts.isCallExpression(node) &&
          ts.isIdentifier(node.expression) &&
          node.expression.text === 't' &&
          node.arguments.length < 3
        ) {
          const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
          failures.push(`${file}:${line} calls t() without Chinese copy`);
        }

        if (ts.isObjectLiteralExpression(node)) {
          const keys = node.properties
            .filter(ts.isPropertyAssignment)
            .map((property) => property.name.getText(source).replace(/["']/g, ''));
          if (keys.includes('en') && keys.includes('ar') && !keys.includes('zh')) {
            const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
            failures.push(`${file}:${line} has English and Arabic copy without Chinese copy`);
          }
        }

        ts.forEachChild(node, visit);
      };

      visit(source);
    }

    expect(failures).toEqual([]);
  });
});
