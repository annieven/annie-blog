import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState, useMemo, useEffect } from "react";
import { getLoginUrl } from "@/const";
import { Loader2, Plus } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  const [selectedTag, setSelectedTag] = useState<string | undefined>();

  // Read tag from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tag = params.get("tag");
    if (tag) {
      setSelectedTag(tag);
    }
  }, [location]);

  // Fetch all posts (optionally filtered by tag)
  const { data: posts = [], isLoading } = trpc.posts.list.useQuery({
    tag: selectedTag,
  });

  // Fetch all available tags
  const { data: allTags = [] } = trpc.tags.list.useQuery();

  // Get unique tags from posts for display
  const displayTags = useMemo(() => {
    const tagSet = new Set<string>();
    posts.forEach((post) => {
      post.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [posts]);

  const handleTagClick = (tag: string) => {
    if (selectedTag === tag) {
      setLocation("/");
      setSelectedTag(undefined);
    } else {
      setLocation(`/?tag=${encodeURIComponent(tag)}`);
      setSelectedTag(tag);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="container py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-light text-gray-900">Annie's Blog</h1>
              <p className="text-gray-500 mt-2">A personal collection of thoughts and moments</p>
            </div>
            <div className="flex gap-3">
              {isAuthenticated && (
                <Button
                  onClick={() => setLocation("/admin")}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Post
                </Button>
              )}
              {!isAuthenticated && (
                <Button
                  onClick={() => (window.location.href = getLoginUrl())}
                  variant="outline"
                  size="sm"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Tags Filter */}
      {displayTags.length > 0 && (
        <div className="border-b border-gray-200">
          <div className="container py-6">
            <div className="flex flex-wrap gap-2">
              {displayTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedTag === tag
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {tag}
                </button>
              ))}
              {selectedTag && (
                <button
                  onClick={() => setLocation("/")}
                  className="px-4 py-2 rounded-full text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container py-12">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">
              {selectedTag ? "No posts found with this tag" : "No posts yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {posts.map((post) => (
              <article
                key={post.id}
                className="border-b border-gray-200 pb-12 last:border-b-0 cursor-pointer hover:opacity-75 transition-opacity"
                onClick={() => setLocation(`/posts/${post.id}`)}
              >
                {/* Post Header */}
                <div className="mb-6">
                  <h2 className="text-3xl font-light text-gray-900 mb-2">
                    {post.title}
                  </h2>
                  <p className="text-gray-500 text-sm">
                    {new Date(post.createdAt).toLocaleDateString("zh-TW", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                {/* Post Preview */}
                <div className="mb-6">
                  <p className="text-gray-700 line-clamp-3 leading-relaxed">
                    {post.content.substring(0, 200)}
                    {post.content.length > 200 ? "..." : ""}
                  </p>
                </div>

                {/* Featured Image */}
                {post.images && post.images.length > 0 && (
                  <div className="mb-6 aspect-video rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={post.images[0].imageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs font-medium text-gray-600 bg-gray-50 px-3 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-20">
        <div className="container py-8 text-center text-gray-500 text-sm">
          <p>&copy; 2026 Annie's Blog. All thoughts are my own.</p>
        </div>
      </footer>
    </div>
  );
}
