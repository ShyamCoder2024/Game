
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
    try {
        const user = await prisma.user.findFirst({
            where: { user_id: 'ADMIN001' }
        });
        console.log('User found:', user);
    } catch (err) {
        console.error('Error finding user:', err);
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();
