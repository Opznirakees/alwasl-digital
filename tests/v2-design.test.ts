import { describe, expect, it } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = join(import.meta.dir, '..');
const read = (path: string) => readFileSync(join(repoRoot, path), 'utf8');

describe('V2 multi-category visual system', () => {
  it('keeps the dark brand base and adds the requested pastel accent palette', () => {
    const styles = read('src/app/globals.css');

    for (const token of [
      '--v2-canvas',
      '--v2-surface',
      '--v2-gold',
      '--v2-pink',
      '--v2-sky',
      '--v2-mint',
      '--v2-lavender',
    ]) {
      expect(styles).toContain(token);
    }
    expect(styles).toContain('#020817');
    expect(styles).toContain('#f6b7cc');
    expect(styles).toContain('#9bd8f2');
    expect(styles).toContain('#8fe3d2');
    expect(styles).toContain('#c4b5fd');
  });

  it('uses a branded responsive header with protected mobile destinations', () => {
    const header = read('src/components/layout/Header.tsx');

    expect(header).toContain('data-v2-header');
    expect(header).toContain('data-v2-mobile-brand');
    expect(header).toContain('data-mobile-tab-bar');
    expect(header).toContain('grid-cols-5');
    expect(header).toContain('protectedHref');
    expect(header).toContain('/auth?next=');
    expect(header).toContain("t('Change language'");
  });

  it('renders admin-managed responsive banners as an automatic carousel', () => {
    const hero = read('src/components/home/HeroBanner.tsx');
    const home = read('src/app/page.tsx');
    const bannerRoute = read('src/app/api/banners/route.ts');

    expect(hero).toContain('aria-roledescription="carousel"');
    expect(hero).toContain('window.setInterval');
    expect(hero).toContain('<picture');
    expect(hero).toContain('active.mobileImage');
    expect(hero).toContain('/brand/recharge-hero-v3.webp');
    expect(hero).toContain('/brand/recharge-hero-mobile-v3.webp');
    expect(hero).toContain("role=\"tablist\"");
    expect(home).toContain("fetch('/api/banners',");
    expect(home).toContain('<HeroBanner banners={banners}');
    expect(bannerRoute).toContain('isActive: true');
  });

  it('keeps LEO out of the hero and exposes only a subtle footer contact', () => {
    const hero = read('src/components/home/HeroBanner.tsx');
    const home = read('src/app/page.tsx');

    expect(hero).not.toContain('leo-waho-agent');
    expect(home).toContain('/brand/leo-waho-agent.jpeg');
    expect(home).toContain('sizes="32px"');
    expect(home).toContain('supportWhatsAppHref');
  });

  it('shows public category metadata but sends logged-out customers to WhatsApp login for prices', () => {
    const home = read('src/app/page.tsx');
    const categoryPage = read('src/app/categories/[slug]/page.tsx');
    const categoriesRoute = read('src/app/api/categories/route.ts');
    const categoryRoute = read('src/app/api/categories/[slug]/route.ts');

    expect(home).toContain('CatalogCategory');
    expect(home).toContain('catalog-category-card');
    expect(home).toContain('/auth?next=');
    expect(home).toContain('Prices open after login');
    expect(categoryPage).toContain('isAuthenticated');
    expect(categoryPage).toContain('/auth?next=');
    expect(categoryPage).toContain('PriceDisplay');
    expect(categoriesRoute).toContain('CatalogCategory');
    expect(categoryRoute).toContain('requireUser');
  });

  it('ships recognizable WAHO and Asiacell category assets without unrelated game products', () => {
    const home = read('src/app/page.tsx');
    const seeds = read('src/data/catalog-seeds.ts');
    const migration = read('prisma/migrations/20260822130000_seed_multi_category_catalog/migration.sql');

    expect(existsSync(join(repoRoot, 'public/brand/waho-app-icon.webp'))).toBe(true);
    expect(existsSync(join(repoRoot, 'public/brand/asiacell-category.svg'))).toBe(true);
    expect(existsSync(join(repoRoot, 'public/brand/recharge-hero-v3.webp'))).toBe(true);
    expect(existsSync(join(repoRoot, 'public/brand/recharge-hero-mobile-v3.webp'))).toBe(true);
    expect(seeds).toContain('mastercardWahoPackages');
    expect(seeds).toContain('asiacellWahoPackages');
    expect(migration).toContain("'asiacell'");
    expect(`${home}\n${seeds}`).not.toMatch(/PUBG|Free Fire|TikTok|Google Play/);
  });

  it('supports automatic account top-up and manual WhatsApp code delivery in one wizard', () => {
    const wizard = read('src/app/top-up/[slug]/page.tsx');
    const orders = read('src/app/orders/page.tsx');

    expect(wizard).toContain('data-v2-checkout-brand');
    expect(wizard).toContain('v2-wizard-progress');
    expect(wizard).toContain('data-v2-mobile-wizard-packages');
    expect(wizard).toContain("game.fulfillmentMode !== 'waho_api'");
    expect(wizard).toContain("t('Delivery'");
    expect(wizard).toContain('Delivery through WhatsApp');
    expect(orders).toContain('getOrderStatusGuidance');
    expect(orders).toContain('Through WhatsApp');
    expect(orders).not.toContain("t('Reorder'");
  });

  it('gives admins real category, banner and fulfillment controls', () => {
    const admin = read('src/app/admin/page.tsx');
    const categoryManager = read('src/components/admin/CatalogCategoryManager.tsx');

    expect(admin).toContain('<CatalogCategoryManager');
    expect(admin).toContain('Storefront category');
    expect(admin).toContain('Delivery method');
    expect(admin).toContain('Mobile image');
    expect(admin).toContain('editingBannerId');
    expect(admin).toContain('fulfillManualOrder');
    expect(categoryManager).toContain('Add category');
    expect(categoryManager).toContain('onToggle');
  });

  it('keeps the customer shell responsive while the top-up index redirects to categories', () => {
    for (const file of [
      'src/app/page.tsx',
      'src/app/categories/[slug]/page.tsx',
      'src/app/top-up/[slug]/page.tsx',
      'src/app/auth/page.tsx',
      'src/app/orders/page.tsx',
      'src/app/wallet/page.tsx',
      'src/app/profile/page.tsx',
      'src/app/settings/page.tsx',
      'src/app/promotions/page.tsx',
      'src/app/cart/page.tsx',
      'src/components/info/InfoPage.tsx',
    ]) {
      expect(read(file), `${file} should use the V2 shell`).toContain('v2-page');
    }
    expect(read('src/app/top-up/page.tsx')).toContain("redirect('/#categories')");
  });

  it('documents the managed multi-category scope and its TDD acceptance criteria', () => {
    const plan = read('v2.md');
    const scope = read('docs/scope-deviations.md');

    expect(plan).toContain('WAHO en Asiacell als eerste categorieen');
    expect(plan).toContain('visuele regressietests');
    expect(plan).toContain('Definition of Done voor V2');
    expect(scope).toContain('Managed Multi-Category Catalog Scope');
    expect(scope).toContain('Public package prices require an authenticated customer');
    expect(scope).toContain('manual code or manual top-up fulfillment');
  });
});
