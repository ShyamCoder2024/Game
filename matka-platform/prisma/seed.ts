// prisma/seed.ts
// Matka Platform — Seed Data
// Seeds: 11 games, 5 global multipliers, 8 app settings

import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {

  // ====== ADMIN USER ======
  const adminId = process.env.ADMIN_ID || 'ADMIN001';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin@matka2026';
  const adminHash = await argon2.hash(adminPassword, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  await prisma.user.upsert({
    where: { user_id: adminId },
    update: { password_hash: adminHash },
    create: {
      user_id: adminId,
      name: 'Admin',
      password_hash: adminHash,
      role: 'admin',
      wallet_balance: 0,
      is_active: true,
    },
  });
  console.log(`✅ Admin user seeded (${adminId})`);

  // ====== DEFAULT GAMES ======
  const games = [
    { name: 'SRIDEVI', slug: 'sridevi', open_time: '11:42', close_time: '12:43', result_time: '12:45', color_code: '#22C55E', display_order: 1 },
    { name: 'TIME BAZAR', slug: 'time-bazar', open_time: '13:09', close_time: '14:09', result_time: '14:15', color_code: '#3B82F6', display_order: 2 },
    { name: 'MILAN DAY', slug: 'milan-day', open_time: '15:12', close_time: '17:13', result_time: '17:15', color_code: '#EAB308', display_order: 3 },
    { name: 'RAJDHANI DAY', slug: 'rajdhani-day', open_time: '15:19', close_time: '17:19', result_time: '17:25', color_code: '#A855F7', display_order: 4 },
    { name: 'NEW KAMDHENU DAY', slug: 'new-kamdhenu-day', open_time: '15:30', close_time: '17:30', result_time: '17:35', color_code: '#14B8A6', display_order: 5 },
    { name: 'KALYAN', slug: 'kalyan', open_time: '16:22', close_time: '18:22', result_time: '18:30', color_code: '#F97316', display_order: 6 },
    { name: 'SRIDEVI NIGHT', slug: 'sridevi-night', open_time: '19:24', close_time: '20:24', result_time: '20:30', color_code: '#22C55E', display_order: 7 },
    { name: 'NEW KAMDHENU NIGHT', slug: 'new-kamdhenu-night', open_time: '19:45', close_time: '20:45', result_time: '20:50', color_code: '#14B8A6', display_order: 8 },
    { name: 'MILAN NIGHT', slug: 'milan-night', open_time: '21:11', close_time: '23:11', result_time: '23:15', color_code: '#EAB308', display_order: 9 },
    { name: 'RAJDHANI NIGHT', slug: 'rajdhani-night', open_time: '21:44', close_time: '23:53', result_time: '23:55', color_code: '#A855F7', display_order: 10 },
    { name: 'MAIN BAZAR', slug: 'main-bazar', open_time: '22:01', close_time: '00:10', result_time: '00:15', color_code: '#EC4899', display_order: 11 },
  ];

  for (const game of games) {
    await prisma.game.upsert({
      where: { slug: game.slug },
      update: game,
      create: game,
    });
  }
  console.log(`✅ Seeded ${games.length} games`);

  // ====== GLOBAL DEFAULT PAYOUT MULTIPLIERS ======
  // game_id = null means global default
  const multipliers = [
    { bet_type: 'SINGLE_AKDA' as const, multiplier: 10 },
    { bet_type: 'SINGLE_PATTI' as const, multiplier: 160 },
    { bet_type: 'DOUBLE_PATTI' as const, multiplier: 320 },
    { bet_type: 'TRIPLE_PATTI' as const, multiplier: 700 },
    { bet_type: 'JODI' as const, multiplier: 100 },
  ];

  for (const m of multipliers) {
    // Upsert with null game_id for global defaults
    const existing = await prisma.payoutMultiplier.findFirst({
      where: { game_id: null, bet_type: m.bet_type },
    });

    if (existing) {
      await prisma.payoutMultiplier.update({
        where: { id: existing.id },
        data: { multiplier: m.multiplier },
      });
    } else {
      await prisma.payoutMultiplier.create({
        data: { game_id: null, bet_type: m.bet_type, multiplier: m.multiplier },
      });
    }
  }
  console.log(`✅ Seeded ${multipliers.length} global payout multipliers`);

  // ====== DEFAULT APP SETTINGS ======
  const settings = [
    { key: 'whatsapp_number', value: '+919999999999', category: 'contact', description: 'WhatsApp contact number' },
    { key: 'min_bet_amount', value: '10', category: 'betting', description: 'Minimum bet amount in coins' },
    { key: 'max_bet_amount', value: '100000', category: 'betting', description: 'Maximum bet amount in coins' },
    { key: 'daily_reset_time', value: '02:00', category: 'general', description: 'Daily reset time in IST' },
    { key: 'result_retention_days', value: '2', category: 'general', description: 'Days to keep results before deletion' },
    { key: 'default_deal_percentage', value: '85', category: 'betting', description: 'Default deal percentage for new SMs' },
    { key: 'maintenance_mode', value: 'false', category: 'general', description: 'Enable maintenance mode' },
    { key: 'user_id_prefix', value: 'PL', category: 'general', description: 'Prefix for auto-generated user IDs' },
    { key: 'master_password', value: '$argon2id$v=19$m=65536,t=3,p=4$PLACEHOLDER', category: 'security', description: 'Master password hash (set via developer script only)' },
  ];

  for (const s of settings) {
    await prisma.appSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log(`✅ Seeded ${settings.length} app settings`);

  console.log('\n🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
