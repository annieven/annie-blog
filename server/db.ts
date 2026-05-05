import { eq, desc, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, posts, postImages, postTags, InsertPost, InsertPostImage, InsertPostTag, User, Post } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Posts queries
export async function listPosts(tag?: string) {
  const db = await getDb();
  if (!db) return [];

  if (tag) {
    const postsWithTag = await db
      .select({ postId: postTags.postId })
      .from(postTags)
      .where(eq(postTags.tag, tag));
    
    const postIds = postsWithTag.map((p: any) => p.postId);
    if (postIds.length === 0) return [];
    
    const results = await db
      .select()
      .from(posts)
      .where(inArray(posts.id, postIds))
      .orderBy(desc(posts.createdAt));
    
    return enrichPostsWithAuthor(results);
  }

  const results = await db.select().from(posts).orderBy(desc(posts.createdAt));
  return enrichPostsWithAuthor(results);
}

async function enrichPostsWithAuthor(postsArray: Post[]) {
  const db = await getDb();
  if (!db) return postsArray;

  const authorMap = new Map<number, User>();
  
  // Fetch all unique authors
  const authorIds = Array.from(new Set(postsArray.map(p => p.authorId)));
  for (const authorId of authorIds) {
    const author = await db.select().from(users).where(eq(users.id, authorId)).limit(1);
    if (author.length > 0) {
      authorMap.set(authorId, author[0]);
    }
  }

  // Attach author info to posts
  return postsArray.map(post => ({
    ...post,
    author: authorMap.get(post.authorId),
  }));
}

export async function getPostById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (result.length === 0) return undefined;
  
  const enriched = await enrichPostsWithAuthor([result[0]]);
  return enriched[0];
}

export async function createPost(data: InsertPost) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(posts).values(data);
  return result;
}

export async function updatePost(id: number, data: Partial<InsertPost>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.update(posts).set(data).where(eq(posts.id, id));
}

export async function deletePost(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(postImages).where(eq(postImages.postId, id));
  await db.delete(postTags).where(eq(postTags.postId, id));
  
  return db.delete(posts).where(eq(posts.id, id));
}

// Post images queries
export async function getPostImages(postId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(postImages)
    .where(eq(postImages.postId, postId))
    .orderBy(postImages.order);
}

export async function addPostImage(data: InsertPostImage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(postImages).values(data);
}

export async function deletePostImage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.delete(postImages).where(eq(postImages.id, id));
}

// Post tags queries
export async function getPostTags(postId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(postTags).where(eq(postTags.postId, postId));
}

export async function addPostTag(data: InsertPostTag) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(postTags).values(data);
}

export async function deletePostTag(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.delete(postTags).where(eq(postTags.id, id));
}

export async function getAllTags() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.selectDistinct({ tag: postTags.tag }).from(postTags);
  return result.map(r => r.tag).sort();
}
