
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
    const password = 'test123';
    const hashedPassword = await argon2.hash(password);

    console.log('Creating test users...');

    // 1. Get Admin (created by seed)
    const admin = await prisma.user.findFirst({
        where: { role: 'admin' },
    });

    if (!admin) {
        console.error('Admin user not found! Please run seed first.');
        process.exit(1);
    }

    // 2. Create Super Master
    const superMaster = await prisma.user.upsert({
        where: { user_id: 'SM001' },
        update: {},
        create: {
            user_id: 'SM001',
            password_hash: hashedPassword,
            role: 'supermaster',
            name: 'Test Super Master',
            wallet_balance: 100000,
            is_active: true,
            is_blocked: false,
            is_deleted: false,
            deal_percentage: 90,
            created_by: admin.id, // Parent is Admin
        },
    });
    console.log(`Created Super Master: ${superMaster.user_id}`);

    // 3. Create Master
    const master = await prisma.user.upsert({
        where: { user_id: 'MA001' },
        update: {},
        create: {
            user_id: 'MA001',
            password_hash: hashedPassword,
            role: 'master',
            name: 'Test Master',
            wallet_balance: 50000,
            is_active: true,
            is_blocked: false,
            is_deleted: false,
            deal_percentage: 80,
            created_by: superMaster.id, // Parent is Super Master
        },
    });
    console.log(`Created Master: ${master.user_id}`);

    // 4. Create User
    const user = await prisma.user.upsert({
        where: { user_id: 'US001' },
        update: {},
        create: {
            user_id: 'US001',
            password_hash: hashedPassword,
            role: 'user',
            name: 'Test User',
            wallet_balance: 10000,
            is_active: true,
            is_blocked: false,
            is_deleted: false,
            deal_percentage: 0, // Users usually have 0 deal
            created_by: master.id, // Parent is Master
        },
    });
    console.log(`Created User: ${user.user_id}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
