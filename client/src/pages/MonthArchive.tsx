import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

interface PostWithDetails {
  id: number;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  authorId: number;
  author?: {
    id: number;
    name: string | null;
    email: string | null;
    openId: string;
  };
  images?: any[];
  tags?: string[];
}

export default function MonthArchive() {
  const params = useParams<{ year: string; month: string }>();
  const [, setLocation] = useLocation();

  const year = parseInt(params?.year || "2026", 10);
  const month = parseInt(params?.month || "1", 10);

  // Validate year and month
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Date</h1>
          <p className="text-gray-600 mb-6">Please use a valid year and month (1-12)</p>
          <button
            onClick={() => setLocation("/")}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const { data: posts = [], isLoading, error } = trpc.posts.byMonth.useQuery({
    year,
    month,
  });

  const monthName = new Date(year, month - 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 sticky top-0 z-50 bg-white">
        <div className="container py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <button
                onClick={() => setLocation("/")}
                className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
              >
                ← Back to Home
              </button>
              <h1 className="text-4xl font-light text-gray-900">
                {monthName}
              </h1>
              <p className="text-gray-500 mt-2">
                {posts.length} article{posts.length !== 1 ? "s" : ""} published
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 text-lg mb-4">Failed to load articles</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No articles found for {monthName}
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {posts.map((post: PostWithDetails) => (
              <article
                key={post.id}
                className="pb-12 border-b border-gray-200 last:border-b-0 cursor-pointer hover:opacity-75 transition-opacity"
                onClick={() => setLocation(`/posts/${post.id}`)}
              >
                {/* Post Header */}
                <div className="mb-4">
                  <h2 className="text-3xl font-light text-gray-900 mb-2">
                    {post.title}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>
                      {new Date(post.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    {post.author && <span>By {post.author.name}</span>}
                    {post.updatedAt && post.updatedAt !== post.createdAt && (
                      <span className="text-gray-400">
                        Last updated{" "}
                        {new Date(post.updatedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Post Preview */}
                <div className="mb-6 text-gray-700 line-clamp-3 leading-relaxed">
                  <p>{post.content.substring(0, 200) + (post.content.length > 200 ? "..." : "")}</p>
                </div>

                {/* Featured Image */}
                {post.images && post.images.length > 0 && (
                  <div className="mb-6 aspect-video rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={post.images[0].url}
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
                        className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full"
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
          <p>
            &copy; 2026 {import.meta.env.VITE_APP_TITLE || "Annie's Blog"}. All
            thoughts are my own.
          </p>
        </div>
      </footer>
    </div>
  );
}
