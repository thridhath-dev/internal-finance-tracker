import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Define categories to create
  const categories = [
    // Income Categories
    {
      name: 'Salary',
      type: 'income',
      monthlyTarget: 5000.00,
    },
    {
      name: 'Freelance',
      type: 'income',
      monthlyTarget: 2000.00,
    },
    {
      name: 'Investment',
      type: 'income',
      monthlyTarget: 500.00,
    },
    {
      name: 'Business',
      type: 'income',
      monthlyTarget: 3000.00,
    },
    // Expense Categories
    {
      name: 'Food & Dining',
      type: 'expense',
      monthlyTarget: 800.00,
    },
    {
      name: 'Transportation',
      type: 'expense',
      monthlyTarget: 400.00,
    },
    {
      name: 'Housing',
      type: 'expense',
      monthlyTarget: 1500.00,
    },
    {
      name: 'Healthcare',
      type: 'expense',
      monthlyTarget: 200.00,
    },
    {
      name: 'Entertainment',
      type: 'expense',
      monthlyTarget: 300.00,
    },
    {
      name: 'Shopping',
      type: 'expense',
      monthlyTarget: 500.00,
    },
    {
      name: 'Education',
      type: 'expense',
      monthlyTarget: 400.00,
    },
    {
      name: 'Bills & Utilities',
      type: 'expense',
      monthlyTarget: 600.00,
    },
  ];

  console.log('📝 Creating categories...');

  // Create categories
  for (const category of categories) {
    const created = await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
    console.log(`✅ Created category: ${created.name} (${created.type}) - Target: $${created.monthlyTarget}`);
  }

  console.log('🎉 Seed completed successfully!');
  console.log(`📊 Total categories created: ${categories.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

