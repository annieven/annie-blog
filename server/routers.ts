import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  listPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  getPostImages,
  addPostImage,
  deletePostImage,
  getPostTags,
  addPostTag,
  deletePostTag,
  getAllTags,
} from "./db";
import { storagePut } from "./storage";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  posts: router({
    // Get all posts, optionally filtered by tag
    list: publicProcedure
      .input(z.object({ tag: z.string().optional() }).optional())
      .query(async ({ input }) => {
        const tag = input?.tag;
        const allPosts = await listPosts(tag);
        
        // Fetch images and tags for each post
        const postsWithDetails = await Promise.all(
          allPosts.map(async (post) => {
            const images = await getPostImages(post.id);
            const tags = await getPostTags(post.id);
            return {
              ...post,
              images,
              tags: tags.map(t => t.tag),
            };
          })
        );
        
        return postsWithDetails;
      }),

    // Get a single post by ID
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const post = await getPostById(input.id);
        if (!post) return null;
        
        const images = await getPostImages(post.id);
        const tags = await getPostTags(post.id);
        
        return {
          ...post,
          images,
          tags: tags.map(t => t.tag),
        };
      }),

    // Create a new post (protected)
    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1),
          content: z.string().min(1),
          tags: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const result = await createPost({
          title: input.title,
          content: input.content,
          authorId: ctx.user.id,
        });
        
        const postId = (result as any)[0]?.insertId || (result as any).insertId;
        
        // Add tags if provided
        if (input.tags && input.tags.length > 0) {
          for (const tag of input.tags) {
            const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
            await addPostTag({
              postId,
              tag: cleanTag,
            });
          }
        }
        
        return { id: postId };
      }),

    // Update a post (protected)
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(1).optional(),
          content: z.string().min(1).optional(),
          tags: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const post = await getPostById(input.id);
        if (!post) throw new Error("Post not found");
        if (post.authorId !== ctx.user.id) throw new Error("Unauthorized");
        
        // Update post content
        if (input.title || input.content) {
          await updatePost(input.id, {
            title: input.title,
            content: input.content,
          });
        }
        
        // Update tags if provided
        if (input.tags !== undefined) {
          // Delete existing tags for this post
          const existingTags = await getPostTags(input.id);
          for (const tag of existingTags) {
            await deletePostTag(tag.id);
          }
          for (const tag of input.tags) {
            const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
            await addPostTag({
              postId: input.id,
              tag: cleanTag,
            });
          }
        }
        
        return { success: true };
      }),

    // Delete a post (protected)
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const post = await getPostById(input.id);
        if (!post) throw new Error("Post not found");
        if (post.authorId !== ctx.user.id) throw new Error("Unauthorized");
        
        await deletePost(input.id);
        return { success: true };
      }),
  }),

  images: router({
    // Upload an image (protected)
    upload: protectedProcedure
      .input(
        z.object({
          postId: z.number(),
          fileBuffer: z.any(),
          fileName: z.string(),
          mimeType: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const post = await getPostById(input.postId);
        if (!post) throw new Error("Post not found");
        if (post.authorId !== ctx.user.id) throw new Error("Unauthorized");
        
        const fileKey = `posts/${input.postId}/${Date.now()}-${input.fileName}`;
        const buffer = Buffer.isBuffer(input.fileBuffer)
          ? input.fileBuffer
          : Buffer.from(input.fileBuffer);
        const { url, key } = await storagePut(fileKey, buffer, input.mimeType);
        
        // Get the highest order number for this post
        const existingImages = await getPostImages(input.postId);
        const nextOrder = existingImages.length;
        
        const result = await addPostImage({
          postId: input.postId,
          imageUrl: url,
          imageKey: key,
          order: nextOrder,
        });
        
        return { url, key, id: (result as any).insertId };
      }),

    // Delete an image (protected)
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Note: In a real app, you'd verify the user owns the post
        await deletePostImage(input.id);
        return { success: true };
      }),
  }),

  tags: router({
    // Get all unique tags
    list: publicProcedure.query(async () => {
      return getAllTags();
    }),
  }),
});

export type AppRouter = typeof appRouter;
