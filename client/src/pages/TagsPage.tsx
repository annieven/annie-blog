import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TagsPage() {
  const [, setLocation] = useLocation();
  const { data: tags, isLoading, error } = trpc.tags.list.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
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
            <p className="text-red-500 text-lg mb-4">Failed to load tags</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="container py-8">
          <h2
            className="text-2xl font-light text-gray-900 cursor-pointer hover:opacity-70 transition-opacity mb-4"
            onClick={() => setLocation("/")}
          >
            {import.meta.env.VITE_APP_TITLE || "Pensieve"}
          </h2>
          <Button
            onClick={() => setLocation("/")}
            variant="ghost"
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-4xl font-light text-gray-900">All Tags</h1>
          <p className="text-gray-500 mt-2">
            {tags?.length || 0} tags • Click a tag to view related posts
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-12">
        <div className="container">
          {!tags || tags.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">No tags yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tags.map((tag: string) => (
                <button
                  key={tag}
                  onClick={() => setLocation(`/?tag=${encodeURIComponent(tag)}`)}
                  className="p-4 rounded-lg border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="text-lg font-medium text-gray-900">
                    {tag}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-20">
        <div className="container py-8 text-center text-gray-500 text-sm">
          <p>&copy; 2026 {import.meta.env.VITE_APP_TITLE || "Pensieve"}. All thoughts are my own.</p>
        </div>
      </footer>
    </div>
  );
}
