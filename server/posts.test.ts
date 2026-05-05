import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { getDb, upsertUser } from "./db";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `testuser${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "test",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("posts router", () => {
  beforeEach(async () => {
    // Create test users
    await upsertUser({
      openId: "test-user-1",
      email: "testuser1@example.com",
      name: "Test User 1",
      loginMethod: "test",
    });

    await upsertUser({
      openId: "test-user-2",
      email: "testuser2@example.com",
      name: "Test User 2",
      loginMethod: "test",
    });
  });

  describe("posts.list", () => {
    it("should return empty list initially", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.posts.list();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("posts.create", () => {
    it("should create a new post with authenticated user", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.posts.create({
        title: "Test Post",
        content: "This is a test post",
        tags: ["#test", "#demo"],
      });

      expect(result).toHaveProperty("id");
      expect(typeof result.id).toBe("number");
    });

    it("should fail to create post without authentication", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.posts.create({
          title: "Test Post",
          content: "This is a test post",
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should fail to create post with empty title", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.posts.create({
          title: "",
          content: "This is a test post",
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("posts.getById", () => {
    it("should retrieve a post by ID", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      // Create a post first
      const createResult = await caller.posts.create({
        title: "Test Post",
        content: "This is a test post",
        tags: ["#test"],
      });

      // Retrieve the post
      const getResult = await caller.posts.getById({ id: createResult.id });

      expect(getResult).toBeDefined();
      expect(getResult?.title).toBe("Test Post");
      expect(getResult?.content).toBe("This is a test post");
      expect(getResult?.tags).toContain("#test");
    });

    it("should return null for non-existent post", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.posts.getById({ id: 99999 });
      expect(result).toBeNull();
    });
  });

  describe("posts.update", () => {
    it("should update a post by author", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      // Create a post
      const createResult = await caller.posts.create({
        title: "Original Title",
        content: "Original content",
      });

      // Update the post
      const updateResult = await caller.posts.update({
        id: createResult.id,
        title: "Updated Title",
        content: "Updated content",
      });

      expect(updateResult.success).toBe(true);

      // Verify the update
      const getResult = await caller.posts.getById({ id: createResult.id });
      expect(getResult?.title).toBe("Updated Title");
      expect(getResult?.content).toBe("Updated content");
    });

    it("should fail to update post by non-author", async () => {
      const ctx1 = createAuthContext(1);
      const caller1 = appRouter.createCaller(ctx1);

      // Create a post by user 1
      const createResult = await caller1.posts.create({
        title: "Test Post",
        content: "Test content",
      });

      // Try to update by user 2
      const ctx2 = createAuthContext(2);
      const caller2 = appRouter.createCaller(ctx2);

      try {
        await caller2.posts.update({
          id: createResult.id,
          title: "Hacked Title",
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("posts.delete", () => {
    it("should delete a post by author", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      // Create a post
      const createResult = await caller.posts.create({
        title: "Test Post",
        content: "Test content",
      });

      // Delete the post
      const deleteResult = await caller.posts.delete({ id: createResult.id });
      expect(deleteResult.success).toBe(true);

      // Verify deletion
      const getResult = await caller.posts.getById({ id: createResult.id });
      expect(getResult).toBeNull();
    });

    it("should fail to delete post by non-author", async () => {
      const ctx1 = createAuthContext(1);
      const caller1 = appRouter.createCaller(ctx1);

      // Create a post by user 1
      const createResult = await caller1.posts.create({
        title: "Test Post",
        content: "Test content",
      });

      // Try to delete by user 2
      const ctx2 = createAuthContext(2);
      const caller2 = appRouter.createCaller(ctx2);

      try {
        await caller2.posts.delete({ id: createResult.id });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("tags.list", () => {
    it("should return all unique tags", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      // Create posts with different tags
      await caller.posts.create({
        title: "Post 1",
        content: "Content 1",
        tags: ["#travel", "#photography"],
      });

      await caller.posts.create({
        title: "Post 2",
        content: "Content 2",
        tags: ["#travel", "#life"],
      });

      // Get all tags
      const tags = await caller.tags.list();
      expect(Array.isArray(tags)).toBe(true);
      expect(tags).toContain("#travel");
      expect(tags).toContain("#photography");
      expect(tags).toContain("#life");
    });
  });
});

  describe("posts.list with tag filter", () => {
  describe("posts.list with tag filter", () => {
    it("should filter posts by tag", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      // Create posts with different tags using unique identifiers
      const timestamp = Date.now();
      await caller.posts.create({
        title: `Filter Test Travel Post 1 ${timestamp}`,
        content: "Content 1",
        tags: [`#filter-test-travel-${timestamp}`, "#photography"],
      });

      await caller.posts.create({
        title: `Filter Test Life Post ${timestamp}`,
        content: "Content 2",
        tags: [`#filter-test-life-${timestamp}`],
      });

      await caller.posts.create({
        title: `Filter Test Travel Post 2 ${timestamp}`,
        content: "Content 3",
        tags: [`#filter-test-travel-${timestamp}`],
      });

      // Get posts with the unique travel tag
      const travelPosts = await caller.posts.list({ tag: `#filter-test-travel-${timestamp}` });
      expect(travelPosts.length).toBe(2);
      expect(travelPosts.some((p) => p.title.includes("Filter Test Travel Post 1"))).toBe(true);
      expect(travelPosts.some((p) => p.title.includes("Filter Test Travel Post 2"))).toBe(true);

      // Get posts with the unique life tag
      const lifePosts = await caller.posts.list({ tag: `#filter-test-life-${timestamp}` });
      expect(lifePosts.length).toBe(1);
      expect(lifePosts[0]?.title.includes("Filter Test Life Post")).toBe(true);

      // Get posts with non-existent tag
      const noPosts = await caller.posts.list({ tag: "#nonexistent-filter-test-xyz" });
      expect(noPosts.length).toBe(0);
    });
  });
});
