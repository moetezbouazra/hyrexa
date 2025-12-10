import prisma from '../src/config/database.js';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hyrexa.com' },
    update: {},
    create: {
      email: 'admin@hyrexa.com',
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN',
      carbonPoints: 0,
    },
  });
  console.log('✓ Admin user created:', admin.email);

  // Create test users
  const users = [];
  for (let i = 1; i <= 5; i++) {
    const password = await bcrypt.hash('test123', 12);
    const user = await prisma.user.upsert({
      where: { email: `user${i}@test.com` },
      update: {},
      create: {
        email: `user${i}@test.com`,
        username: `user${i}`,
        password,
        role: 'USER',
        carbonPoints: Math.floor(Math.random() * 500) + 50,
      },
    });
    users.push(user);
  }
  console.log(`✓ Created ${users.length} test users`);

  // Create achievements
  const achievementsData = [
    {
      name: 'First Cleanup',
      identifier: 'first-cleanup',
      description: 'Complete your first cleanup activity',
      icon: '🌱',
      requiredPoints: 0,
      category: 'cleanup',
      tier: 'bronze',
      isSpecial: true,
    },
    {
      name: 'Eco Warrior',
      identifier: 'eco-warrior',
      description: 'Earn 100 carbon points',
      icon: '⚔️',
      requiredPoints: 100,
      category: 'cleanup',
      tier: 'silver',
      isSpecial: false,
    },
    {
      name: 'Planet Saver',
      identifier: 'planet-saver',
      description: 'Earn 500 carbon points',
      icon: '🌍',
      requiredPoints: 500,
      category: 'cleanup',
      tier: 'gold',
      isSpecial: false,
    },
    {
      name: '100 Club',
      identifier: '100-club',
      description: 'Complete 100 cleanup activities',
      icon: '💯',
      requiredPoints: 0,
      category: 'cleanup',
      tier: 'platinum',
      isSpecial: true,
    },
    {
      name: 'Community Leader',
      identifier: 'community-leader',
      description: 'Earn 1000 carbon points',
      icon: '👑',
      requiredPoints: 1000,
      category: 'social',
      tier: 'platinum',
      isSpecial: false,
    },
    {
      name: 'Early Adopter',
      identifier: 'early-adopter',
      description: 'Join Hyrexa in its early days',
      icon: '🚀',
      requiredPoints: 0,
      category: 'special',
      tier: 'gold',
      isSpecial: true,
    },
    {
      name: 'Week Warrior',
      identifier: 'week-warrior',
      description: 'Maintain a 7-day activity streak',
      icon: '🔥',
      requiredPoints: 0,
      category: 'streak',
      tier: 'bronze',
      isSpecial: false,
    },
    {
      name: 'Month Champion',
      identifier: 'month-champion',
      description: 'Maintain a 30-day activity streak',
      icon: '⚡',
      requiredPoints: 0,
      category: 'streak',
      tier: 'gold',
      isSpecial: false,
    },
    {
      name: 'Century Streak',
      identifier: 'century-streak',
      description: 'Maintain a 100-day activity streak',
      icon: '🌟',
      requiredPoints: 0,
      category: 'streak',
      tier: 'platinum',
      isSpecial: true,
    },
  ];

  for (const achievementData of achievementsData) {
    await prisma.achievement.upsert({
      where: { name: achievementData.name },
      update: {},
      create: achievementData,
    });
  }
  console.log(`✓ Created ${achievementsData.length} achievements`);

  // Create sample waste reports
  const wasteTypes = ['PLASTIC_BOTTLES', 'PLASTIC_BAGS', 'MIXED_PLASTIC', 'STYROFOAM'];
  const locations = [
    { lat: 36.8065, lng: 10.1815, name: 'Tunis Beach' },
    { lat: 36.7538, lng: 10.2252, name: 'Carthage Coast' },
    { lat: 36.8395, lng: 10.3135, name: 'La Marsa' },
    { lat: 36.8625, lng: 10.1947, name: 'Gammarth' },
    { lat: 36.7953, lng: 10.1609, name: 'Lake of Tunis' },
  ];

  for (let i = 0; i < 10; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomLocation = locations[Math.floor(Math.random() * locations.length)];
    const randomType = wasteTypes[Math.floor(Math.random() * wasteTypes.length)];

    await prisma.wasteReport.create({
      data: {
        latitude: randomLocation.lat + (Math.random() - 0.5) * 0.1,
        longitude: randomLocation.lng + (Math.random() - 0.5) * 0.1,
        locationName: randomLocation.name,
        description: `Waste found near ${randomLocation.name}`,
        wasteType: randomType as any,
        severity: Math.floor(Math.random() * 5) + 1,
        photos: ['sample-photo-1.jpg'],
        reporterId: randomUser.id,
        status: i % 3 === 0 ? 'APPROVED' : 'PENDING_REVIEW',
        aiAnalysisData: {
          detected: true,
          objectsCount: Math.floor(Math.random() * 5) + 1,
          confidence: 0.8 + Math.random() * 0.15,
        },
      },
    });
  }
  console.log('✓ Created 10 sample waste reports');

  // Grant "First Cleanup" achievement to all users
  const firstCleanupAchievement = await prisma.achievement.findUnique({
    where: { name: 'First Cleanup' },
  });

  if (firstCleanupAchievement) {
    for (const user of users) {
      await prisma.userAchievement.upsert({
        where: {
          userId_achievementId: {
            userId: user.id,
            achievementId: firstCleanupAchievement.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          achievementId: firstCleanupAchievement.id,
        },
      });
    }
    console.log('✓ Granted "First Cleanup" achievement to all users');
  }

  console.log('✅ Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
