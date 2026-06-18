import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { demoUser, games } from '../src/data/mock-data';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/alwasl_digital?schema=public',
  }),
});

async function main() {
  const adminPhone = process.env.SEED_ADMIN_PHONE ?? demoUser.phone;
  const product = games[0];

  await prisma.user.upsert({
    where: { phone: adminPhone },
    update: {
      name: 'Al-Wasl Admin',
      role: 'ADMIN',
      level: 'GOLD',
      walletBalance: 250000,
      totalSpent: 0,
      isVerified: true,
      discountPercentage: 5,
    },
    create: {
      phone: adminPhone,
      name: 'Al-Wasl Admin',
      email: 'admin@alwasl.digital',
      avatar: demoUser.avatar,
      role: 'ADMIN',
      level: 'GOLD',
      walletBalance: 250000,
      totalSpent: 0,
      isVerified: true,
      discountPercentage: 5,
      lastLogin: new Date(),
    },
  });

  await prisma.product.upsert({
    where: { id: product.id },
    update: {
      slug: product.slug,
      name: product.name,
      nameAr: product.nameAr,
      description: product.description,
      descriptionAr: product.descriptionAr,
      image: product.image,
      banner: product.banner,
      category: 'SOCIAL_MEDIA',
      publisher: product.publisher,
      isPopular: product.isPopular,
      isFeatured: product.isFeatured,
      isActive: true,
      requiresUserId: product.requiresUserId,
      userIdLabel: product.userIdLabel,
      userIdLabelAr: product.userIdLabelAr,
      userIdPlaceholder: product.userIdPlaceholder,
      userIdPlaceholderAr: product.userIdPlaceholderAr,
      zoneIdRequired: product.zoneIdRequired,
      zoneIdLabel: product.zoneIdLabel,
      zoneIdLabelAr: product.zoneIdLabelAr,
      countries: product.countries,
    },
    create: {
      id: product.id,
      slug: product.slug,
      name: product.name,
      nameAr: product.nameAr,
      description: product.description,
      descriptionAr: product.descriptionAr,
      image: product.image,
      banner: product.banner,
      category: 'SOCIAL_MEDIA',
      publisher: product.publisher,
      isPopular: product.isPopular,
      isFeatured: product.isFeatured,
      isActive: true,
      requiresUserId: product.requiresUserId,
      userIdLabel: product.userIdLabel,
      userIdLabelAr: product.userIdLabelAr,
      userIdPlaceholder: product.userIdPlaceholder,
      userIdPlaceholderAr: product.userIdPlaceholderAr,
      zoneIdRequired: product.zoneIdRequired,
      zoneIdLabel: product.zoneIdLabel,
      zoneIdLabelAr: product.zoneIdLabelAr,
      countries: product.countries,
    },
  });

  for (const [index, pkg] of product.packages.entries()) {
    await prisma.topupPackage.upsert({
      where: { id: pkg.id },
      update: {
        productId: product.id,
        name: pkg.name,
        nameAr: pkg.nameAr,
        amount: pkg.amount,
        unit: pkg.unit,
        unitAr: pkg.unitAr,
        basePrice: pkg.basePrice,
        salePrice: pkg.salePrice,
        currency: pkg.currency,
        inStock: pkg.inStock,
        isPopular: pkg.isPopular ?? false,
        sortOrder: index,
      },
      create: {
        id: pkg.id,
        productId: product.id,
        name: pkg.name,
        nameAr: pkg.nameAr,
        amount: pkg.amount,
        unit: pkg.unit,
        unitAr: pkg.unitAr,
        basePrice: pkg.basePrice,
        salePrice: pkg.salePrice,
        currency: pkg.currency,
        inStock: pkg.inStock,
        isPopular: pkg.isPopular ?? false,
        sortOrder: index,
      },
    });
  }

  const admin = await prisma.user.findUniqueOrThrow({ where: { phone: adminPhone } });
  const existingInitialDeposit = await prisma.walletTransaction.findFirst({
    where: { userId: admin.id, reference: 'SEED-WALLET-BALANCE' },
  });

  if (!existingInitialDeposit) {
    await prisma.walletTransaction.create({
      data: {
        userId: admin.id,
        type: 'DEPOSIT',
        amount: 250000,
        currency: 'IQD',
        balance: 250000,
        description: 'Initial seeded wallet balance',
        descriptionAr: 'رصيد محفظة أولي',
        reference: 'SEED-WALLET-BALANCE',
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
