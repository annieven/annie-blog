import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { Streamdown } from "streamdown";

interface PostDetailProps {
  params: {
    id: string;
  };
}

export default function PostDetail({ params }: PostDetailProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const postId = parseInt(params.id);

  const { data: post, isLoading } = trpc.posts.getById.useQuery({ id: postId });
  const { data: userPosts, isLoading: userPostsLoading, error: userPostsError } = trpc.posts.getByAuthorId.useQuery(
    { authorId: user?.id || 0 },
    { enabled: !!user }
  );
  const { data: allPosts, isLoading: allPostsLoading, error: allPostsError } = trpc.posts.popular.useQuery({ limit: 5 });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container py-12">
          <Button
            onClick={() => setLocation("/")}
            variant="ghost"
            className="mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">Post not found</p>
          </div>
        </div>
      </div>
    );
  }

  const isAuthor = user?.id === post.authorId;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="container py-8">
          <Button
            onClick={() => setLocation("/")}
            variant="ghost"
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-4xl font-light text-gray-900 mb-4">
            {post.title}
          </h1>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">
                {new Date(post.createdAt).toLocaleDateString("zh-TW", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </p>
              {post.updatedAt && new Date(post.updatedAt).getTime() !== new Date(post.createdAt).getTime() && (
                <p className="text-gray-400 text-xs mt-1">
                  Last updated: {new Date(post.updatedAt).toLocaleDateString("zh-TW", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </p>
              )}
              {(post as any).author && (
                <a
                  href={`/authors/${(post as any).author.id}`}
                  className="text-gray-400 text-xs mt-1 hover:text-gray-600 transition-colors block"
                >
                  By {(post as any).author.name || "Anonymous"}
                </a>
              )}
            </div>
            {isAuthor && (
              <div className="flex gap-2">
                <Button
                  onClick={() => setLocation(`/admin?edit=${post.id}`)}
                  variant="outline"
                  size="sm"
                >
                  Edit
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-12">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Article */}
            <div className="lg:col-span-2">
              {/* Post Content */}
              <div className="prose prose-lg max-w-none mb-12 text-gray-700 leading-relaxed">
                <Streamdown>{post.content.replace(/(?<!\n)\n(?!\n)/g, '  \n')}</Streamdown>
              </div>

              {/* Images Gallery */}
              {post.images && post.images.length > 0 && (
                <div className="mb-12">
                  {/* Mobile version - constrained width */}
                  <div className="md:hidden grid grid-cols-1 gap-6">
                    {post.images.map((image) => (
                      <div
                        key={image.id}
                        className="rounded-lg overflow-hidden bg-gray-100 max-w-full"
                      >
                        <img
                          src={image.imageUrl}
                          alt="Post image"
                          className="w-full h-auto object-contain"
                        />
                      </div>
                    ))}
                  </div>
                  {/* Desktop version - constrained, no scale overflow */}
                  <div className="hidden md:grid grid-cols-1 gap-6 max-w-full overflow-hidden">
                    {post.images.map((image) => (
                      <div
                        key={image.id}
                        className="rounded-lg overflow-hidden bg-gray-100 max-w-full"
                      >
                        <img
                          src={image.imageUrl}
                          alt="Post image"
                          className="w-full h-auto object-contain"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="border-t border-gray-200 pt-8">
                  <h2 className="text-lg font-light text-gray-900 mb-4">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag: string) => (
                      <a
                        key={tag}
                        href={`/?tag=${encodeURIComponent(tag)}`}
                        className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                      >
                        {tag}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar - Hidden on mobile */}
            <aside className="hidden lg:block">
              <div className="sticky top-8">
                <h3 className="text-lg font-light text-gray-900 mb-4">
                  {user ? "Your Posts" : "Popular Posts"}
                </h3>
                <div className="space-y-3">
                  {user ? (
                    // Your Posts - for authenticated users
                    userPostsLoading ? (
                      <div className="text-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400 mx-auto" />
                      </div>
                    ) : userPostsError ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-red-500 mb-2">Failed to load posts</p>
                      </div>
                    ) : userPosts && userPosts.length > 0 ? (
                      userPosts.slice(0, 5).map((p: any) => (
                        <a
                          key={p.id}
                          href={`/posts/${p.id}`}
                          className="block p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                        >
                          <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                            {p.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(p.createdAt).toLocaleDateString("zh-TW", {
                              month: "2-digit",
                              day: "2-digit",
                            })}
                          </p>
                        </a>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-8">No posts yet</p>
                    )
                  ) : (
                    // Popular Posts - for non-authenticated users
                    allPostsLoading ? (
                      <div className="text-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400 mx-auto" />
                      </div>
                    ) : allPostsError ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-red-500 mb-2">Failed to load posts</p>
                      </div>
                    ) : allPosts && allPosts.length > 0 ? (
                      allPosts.slice(0, 5).map((p: any) => (
                        <a
                          key={p.id}
                          href={`/posts/${p.id}`}
                          className="block p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                        >
                          <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                            {p.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(p.createdAt).toLocaleDateString("zh-TW", {
                              month: "2-digit",
                              day: "2-digit",
                            })}
                          </p>
                        </a>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-8">No posts available</p>
                    )
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-20">
        <div className="container py-8 text-center text-gray-500 text-sm">
          <p>&copy; 2026 {import.meta.env.VITE_APP_TITLE || "Annie's Blog"}. All thoughts are my own.</p>
        </div>
      </footer>
    </div>
  );
}
