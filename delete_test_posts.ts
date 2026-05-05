import { getDb } from './server/db';
import { inArray } from 'drizzle-orm';
import { users, posts, postImages, postTags } from './drizzle/schema';

async function deleteTestPosts() {
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    process.exit(1);
  }

  try {
    // Get test user IDs
    const testUsers = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(inArray(users.name, ['test-user-1', 'test-user-2']));

    console.log('Test users found:', testUsers);

    if (testUsers.length === 0) {
      console.log('No test users found');
      process.exit(0);
    }

    const testUserIds = testUsers.map(u => u.id);
    console.log('Test user IDs:', testUserIds);

    // Get posts by test users
    const testPosts = await db
      .select({ id: posts.id })
      .from(posts)
      .where(inArray(posts.authorId, testUserIds));

    console.log(`Found ${testPosts.length} posts by test users`);

    if (testPosts.length === 0) {
      console.log('No posts to delete');
      process.exit(0);
    }

    const postIds = testPosts.map(p => p.id);

    // Delete post_images
    await db.delete(postImages).where(inArray(postImages.postId, postIds));
    console.log('Deleted post images');

    // Delete post_tags
    await db.delete(postTags).where(inArray(postTags.postId, postIds));
    console.log('Deleted post tags');

    // Delete posts
    await db.delete(posts).where(inArray(posts.id, postIds));
    console.log(`Deleted ${testPosts.length} posts`);

    console.log('✅ All test posts deleted successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteTestPosts();
