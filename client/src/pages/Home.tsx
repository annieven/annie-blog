import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState, useMemo, useEffect } from "react";
import { getLoginUrl } from "@/const";
import { Loader2, Plus, Search, X } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Streamdown } from "streamdown";

interface PostWithAuthor {
  id: number;
  title: string;
  content: string;
  createdAt: Date;
  authorId: number;
  updatedAt: Date;
  tags?: string[];
  images?: any[];
  author?: {
    id: number;
    name: string | null;
    email: string | null;
    openId: string;
  };
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  const [selectedTag, setSelectedTag] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);

  // Read tag from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tag = params.get("tag");
    if (tag) {
      setSelectedTag(tag);
    }
  }, [location]);

  // Fetch all posts (optionally filtered by tag or search)
  const { data: posts = [], isLoading } = trpc.posts.list.useQuery({
    tag: selectedTag,
    search: isSearching ? searchQuery : undefined,
  });

  // Fetch all available tags
  const { data: allTags = [] } = trpc.tags.list.useQuery();

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(query.length > 0);
    setSelectedTag(undefined); // Clear tag filter when searching
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
  };

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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 sticky top-0 z-50 bg-white">
        <div className="container py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-light text-gray-900">Annie's Blog</h1>
              <p className="text-gray-500 mt-2">A personal collection of thoughts and moments</p>
            </div>
            <div className="flex gap-3">
              {isAuthenticated && (
                <button
                  onClick={() => setLocation("/admin")}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Post
                </button>
              )}
              {!isAuthenticated && (
                <button
                  onClick={() => (window.location.href = getLoginUrl())}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search articles by title or content..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex-1 flex">
        {/* Main Posts Area */}
        <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
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
                    <div className="flex items-center justify-between text-gray-500 text-sm">
                      <div>
                        <p>
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
                          <p className="text-xs text-gray-400 mt-1">
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
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-gray-400 mt-1 hover:text-gray-600 transition-colors block"
                          >
                            By {(post as any).author.name || "Anonymous"}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Post Preview */}
                  <div className="mb-6 text-gray-700 line-clamp-3 leading-relaxed prose prose-sm max-w-none">
                    <Streamdown>{post.content.substring(0, 200) + (post.content.length > 200 ? "..." : "")}</Streamdown>
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

        {/* Right Sidebar - Tags */}
        {displayTags.length > 0 && (
          <aside className="w-64 py-12 pl-4 border-l border-gray-200">
            <div className="sticky top-32">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
                Tags
              </h3>
              <div className="space-y-2">
                {displayTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-20">
        <div className="container py-8 text-center text-gray-500 text-sm">
          <p>&copy; 2026 Annie's Blog. All thoughts are my own.</p>
        </div>
      </footer>
    </div>
  );
}
