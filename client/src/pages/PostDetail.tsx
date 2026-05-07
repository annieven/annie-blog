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
              <>
              <div className="flex gap-2">
                <Button
                  onClick={() => setLocation(`/admin?edit=${post.id}`)}
                  variant="outline"
                  size="sm"
                >
                  Edit
                </Button>
              </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12 max-w-3xl">
        {/* Post Content */}
        <div className="prose prose-lg max-w-none mb-12 text-gray-700 leading-relaxed">
          <Streamdown>{post.content}</Streamdown>
        </div>

        {/* Images Gallery */}
        {post.images && post.images.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-light text-gray-900 mb-6">Images</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {post.images.map((image) => (
                <div
                  key={image.id}
                  className="aspect-video rounded-lg overflow-hidden bg-gray-100"
                >
                  <img
                    src={image.imageUrl}
                    alt="Post image"
                    className="w-full h-full object-cover"
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
