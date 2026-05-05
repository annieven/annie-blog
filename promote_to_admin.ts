import { getDb } from './server/db';
import { eq } from 'drizzle-orm';
import { users } from './drizzle/schema';

async function promoteToAdmin() {
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    process.exit(1);
  }

  try {
    // Get the owner's info from environment
    const ownerOpenId = process.env.OWNER_OPEN_ID;
    const ownerName = process.env.OWNER_NAME;
    
    console.log('Owner OpenId:', ownerOpenId);
    console.log('Owner Name:', ownerName);

    if (!ownerOpenId) {
      console.error('OWNER_OPEN_ID not set in environment');
      process.exit(1);
    }

    // Find the owner user
    const ownerUser = await db
      .select()
      .from(users)
      .where(eq(users.openId, ownerOpenId));

    if (ownerUser.length === 0) {
      console.error('Owner user not found');
      process.exit(1);
    }

    const user = ownerUser[0];
    console.log('Found user:', user.name, '(ID:', user.id + ')');

    // Update role to admin
    await db
      .update(users)
      .set({ role: 'admin' })
      .where(eq(users.openId, ownerOpenId));

    console.log('✅ User promoted to admin successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

promoteToAdmin();
