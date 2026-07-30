import { describe, expect, it } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = join(import.meta.dir, '..');
const read = (path: string) => readFileSync(join(repoRoot, path), 'utf8');

describe('V2 visual system', () => {
  it('defines one semantic navy and gold customer theme', () => {
    const styles = read('src/app/globals.css');

    expect(styles).toContain('--v2-canvas');
    expect(styles).toContain('--v2-surface');
    expect(styles).toContain('--v2-gold');
    expect(styles).toContain('--v2-text');
    expect(styles).toContain('.v2-page');
    expect(styles).toContain('.v2-primary-button');
    expect(styles).toContain('.v2-surface');
  });

  it('uses a branded header and mobile navigation with a gold active state', () => {
    const header = read('src/components/layout/Header.tsx');

    expect(header).toContain('data-v2-header');
    expect(header).toContain('v2-brand-header');
    expect(header).toContain('v2-primary-button');
    expect(header).toContain('data-mobile-tab-bar');
    expect(header).toContain('v2-mobile-navigation');
  });

  it('keeps the V2 brand dark without exposing a color switcher', () => {
    const header = read('src/components/layout/Header.tsx');
    const settings = read('src/app/settings/page.tsx');
    const context = read('src/contexts/AppContext.tsx');
    const layout = read('src/app/layout.tsx');
    const toaster = read('src/components/ui/sonner.tsx');
    const packageJson = read('package.json');

    expect(layout).toContain('<html lang="en" className="dark"');
    expect(toaster).toContain('theme="dark"');
    expect(header).not.toMatch(/toggleTheme|Switch to dark mode|Switch to light mode/);
    expect(settings).not.toMatch(/toggleTheme|Dark appearance|Use dark mode/);
    expect(context).not.toContain('toggleTheme');
    expect(packageJson).not.toContain('next-themes');
  });

  it('matches the reference composition without adding unrelated products', () => {
    const hero = read('src/components/home/HeroBanner.tsx');
    const home = read('src/app/page.tsx');

    expect(hero).toContain('data-v2-hero');
    expect(hero).toContain('v2-hero-brandmark');
    expect(hero).toContain('v2-hero-metrics');
    expect(home).toContain('data-v2-package-grid');
    expect(home).toContain('v2-package-card');
    expect(home).toContain('v2-leo-panel');
    expect(`${hero}\n${home}`).not.toMatch(/PUBG|Free Fire|TikTok|Google Play/);
  });

  it('finishes the reference-inspired brand corner and WAHO package identity', () => {
    const hero = read('src/components/home/HeroBanner.tsx');
    const home = read('src/app/page.tsx');
    const wizard = read('src/app/top-up/[slug]/page.tsx');
    const styles = read('src/app/globals.css');

    expect(hero).toContain('data-v2-brand-corner');
    expect(hero).toContain('v2-hero-brandmark-surface');
    expect(hero).toContain('v2-hero-brandmark-accent');
    expect(hero).toContain('/brand/alwasl-lockup.webp');
    expect(hero).toContain('object-contain');
    expect(styles).toContain('.v2-hero-brandmark-surface');
    expect(styles).toContain('clip-path');
    expect(home).toContain('data-v2-amount-stage');
    expect(home).toContain('/brand/waho-app-icon.webp');
    expect(home).toContain('v2-package-card-app-icon');
    expect(home).toContain('v2-package-card-balance');
    expect(styles).toContain('.v2-package-card::before');
    expect(styles).toContain('.v2-amount-stage');
    expect(wizard).toContain('data-v2-checkout-brand');
    expect(wizard).toContain('/brand/waho-app-icon.webp');
    expect(existsSync(join(repoRoot, 'public/brand/alwasl-lockup.webp'))).toBe(true);
    expect(existsSync(join(repoRoot, 'public/brand/waho-app-icon.webp'))).toBe(true);
  });

  it('adapts the useful reference promises without adding unsupported claims', () => {
    const hero = read('src/components/home/HeroBanner.tsx');
    const home = read('src/app/page.tsx');

    expect(hero).toContain('Fast and clear WAHO top-up');
    expect(hero).toContain('شحن WAHO بسرعة ووضوح');
    expect(hero).toContain('快速清晰地充值 WAHO');
    expect(hero).toContain('Protected order');
    expect(hero).toContain('طلب محمي');
    expect(hero).toContain('订单保护');
    expect(home).toContain('Clear payment choices');
    expect(home).toContain('خيارات دفع واضحة');
    expect(home).toContain('付款选择清晰');
    expect(home).toContain('supportWhatsAppNumber');
    expect(`${hero}\n${home}`).not.toMatch(/24\/7|instant top-up|official WAHO|all games|all apps/i);
  });

  it('uses the compact reference rhythm without a redundant support band', () => {
    const hero = read('src/components/home/HeroBanner.tsx');
    const home = read('src/app/page.tsx');

    expect(hero).toContain('lg:min-h-[500px]');
    expect(hero).toContain('lg:w-[60%]');
    expect(hero).toContain('right-0');
    expect(home).toContain('data-v2-steps-strip');
    expect(home).toContain('data-v2-service-strip');
    expect(home).toContain('data-visual-required-image');
    expect(home).toContain('priority');
    expect(home).toContain("dir === 'rtl' ? 'lg:-order-1'");
    expect(home).toContain("dir === 'rtl' ? 'lg:grid-cols-[240px_minmax(0,1fr)]'");
    expect(home).not.toContain('A question before you top up?');
  });

  it('applies the V2 shell to every customer-facing route', () => {
    const customerShellFiles = [
      'src/app/page.tsx',
      'src/app/top-up/page.tsx',
      'src/app/top-up/[slug]/page.tsx',
      'src/app/auth/page.tsx',
      'src/app/orders/page.tsx',
      'src/app/wallet/page.tsx',
      'src/app/profile/page.tsx',
      'src/app/settings/page.tsx',
      'src/app/promotions/page.tsx',
      'src/app/cart/page.tsx',
      'src/components/info/InfoPage.tsx',
    ];

    for (const file of customerShellFiles) {
      expect(read(file), `${file} should use the V2 customer shell`).toContain('v2-page');
    }
  });

  it('keeps the checkout visually connected to the homepage', () => {
    const overview = read('src/app/top-up/page.tsx');
    const wizard = read('src/app/top-up/[slug]/page.tsx');
    const orders = read('src/app/orders/page.tsx');

    expect(overview).toContain('data-v2-amount-overview');
    expect(overview).toContain('/brand/waho-app-icon.webp');
    expect(overview).toContain('v2-overview-package');
    expect(overview).toContain('grid-cols-2');
    expect(overview).not.toContain('/brand/alwasl-mark.jpg');
    expect(wizard).toContain('data-v2-wizard');
    expect(wizard).toContain('v2-wizard-progress');
    expect(wizard).toContain('v2-primary-button');
    expect(wizard).toContain('v2-surface');
    expect(orders).toContain('/brand/waho-app-icon.webp');
    expect(orders).not.toContain('/brand/alwasl-mark.jpg');
  });

  it('keeps the operational admin shell inside the same brand system', () => {
    const admin = read('src/app/admin/page.tsx');
    const styles = read('src/app/globals.css');

    expect(admin).toContain('data-v2-admin');
    expect(admin).toContain('v2-admin-page');
    expect(styles).toContain('.v2-admin-page');
    expect(styles).toContain('.v2-admin-page button.bg-emerald-600');
  });

  it('documents that V2 remains WAHO-only and test-driven', () => {
    const plan = read('v2.md');

    expect(plan).toContain('Productfocus: uitsluitend het opwaarderen van WAHO-tegoed');
    expect(plan).toContain('TDD-aanpak voor de latere uitvoering');
    expect(plan).toContain('visuele regressietests');
    expect(plan).toContain('Definition of Done voor V2');
  });
});
