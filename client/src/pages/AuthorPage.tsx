import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Streamdown } from "streamdown";

interface AuthorPageProps {
  params: {
    authorId: string;
  };
}

export default function AuthorPage({ params }: AuthorPageProps) {
  const [, setLocation] = useLocation();
  const authorId = parseInt(params.authorId);

  const { data: posts = [], isLoading } = trpc.posts.getByAuthorId.useQuery({
    authorId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const authorName = posts.length > 0 ? (posts[0] as any).author?.name : "Unknown Author";

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
          <h1 className="text-4xl font-light text-gray-900">
            {authorName}
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            {posts.length} {posts.length === 1 ? "article" : "articles"}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12 max-w-3xl">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No articles from this author</p>
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
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </p>
                </div>

                {/* Post Preview */}
                <div className="mb-6 text-gray-700 line-clamp-3 leading-relaxed">
                  <p>{post.content.substring(0, 200) + (post.content.length > 200 ? "..." : "")}</p>
                </div>

                {/* Featured Image */}
                {post.images && post.images.length > 0 && (
                  <div className="mb-6 rounded-lg overflow-hidden bg-gray-100" style={{ height: '240px', maxHeight: '40vh', width: 'fit-content', marginLeft: '0' }}>
                    <img
                      src={post.images[0].imageUrl}
                      alt={post.title}
                      className="h-full object-contain"
                    />
                  </div>
                )}

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag: string) => (
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
    </div>
  );
}
