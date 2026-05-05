import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, X, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

interface UploadedImage {
  id?: number;
  url: string;
  key: string;
}

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  const [editingPostId, setEditingPostId] = useState<number | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Mutations
  const createPostMutation = trpc.posts.create.useMutation();
  const updatePostMutation = trpc.posts.update.useMutation();
  const deletePostMutation = trpc.posts.delete.useMutation();
  const uploadImageMutation = trpc.images.upload.useMutation();
  const deleteImageMutation = trpc.images.delete.useMutation();

  // Queries
  const { data: posts = [], refetch: refetchPosts } = trpc.posts.list.useQuery();
  
  // Get edit post ID from URL query parameter
  const editPostIdFromUrl = (() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const id = params.get('edit');
    return id ? parseInt(id, 10) : null;
  })();
  
  // Fetch the post to edit if edit ID is in URL
  const { data: postToEdit } = trpc.posts.getById.useQuery(
    { id: editPostIdFromUrl || 0 },
    { enabled: !!editPostIdFromUrl }
  );

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [isAuthenticated]);
  
  // Load post data when editing from URL
  useEffect(() => {
    if (editPostIdFromUrl && postToEdit) {
      setEditingPostId(postToEdit.id);
      setTitle(postToEdit.title);
      setContent(postToEdit.content);
      setTags(postToEdit.tags?.join(", ") || "");
      setUploadedImages(
        postToEdit.images?.map((img) => ({
          id: img.id,
          url: img.imageUrl,
          key: img.imageKey,
        })) || []
      );
    }
  }, [editPostIdFromUrl, postToEdit]);

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.currentTarget.files;
    if (!files) return;

    if (!editingPostId) {
      toast.error("Please create or select a post first");
      return;
    }

    setIsUploadingImages(true);
    try {
      for (const file of Array.from(files)) {
        const buffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);
        const result = await uploadImageMutation.mutateAsync({
          postId: editingPostId,
          fileBuffer: uint8Array as any,
          fileName: file.name,
          mimeType: file.type,
        });

        setUploadedImages([
          ...uploadedImages,
          {
            id: result.id,
            url: result.url,
            key: result.key,
          },
        ]);

        toast.success("Image uploaded successfully");
      }
      e.currentTarget.value = "";
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const tagArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);

      if (editingPostId) {
        await updatePostMutation.mutateAsync({
          id: editingPostId,
          title,
          content,
          tags: tagArray,
        });
        toast.success("Post updated successfully");
      } else {
        const result = await createPostMutation.mutateAsync({
          title,
          content,
          tags: tagArray,
        });
        setEditingPostId(result.id);
        toast.success("Post created. Now you can upload images.");
        return; // Don't reset form yet, let user upload images
      }

      // Reset form
      setTitle("");
      setContent("");
      setTags("");
      setUploadedImages([]);
      setEditingPostId(null);
      refetchPosts();
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Failed to save post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      await deletePostMutation.mutateAsync({ id: postId });
      toast.success("Post deleted successfully");
      refetchPosts();
    } catch (error) {
      toast.error("Failed to delete post");
    }
  };

  const handleDeleteImage = async (imageId: number | undefined) => {
    if (!imageId) {
      setUploadedImages(uploadedImages.filter((img) => !img.id));
      return;
    }

    try {
      await deleteImageMutation.mutateAsync({ id: imageId });
      setUploadedImages(uploadedImages.filter((img) => img.id !== imageId));
      toast.success("Image deleted successfully");
    } catch (error) {
      toast.error("Failed to delete image");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-light text-gray-900">Admin Dashboard</h1>
            <Button
              onClick={() => setLocation("/")}
              variant="outline"
              size="sm"
            >
              Back to Blog
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Editor Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <h2 className="text-xl font-light text-gray-900 mb-6">
                {editingPostId ? "Edit Post" : "New Post"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Post title"
                    className="w-full"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your post content here..."
                    className="w-full min-h-64"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (comma-separated)
                  </label>
                  <Input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="#travel, #life, #photography"
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter tags separated by commas. # prefix is optional.
                  </p>
                </div>

                {/* Images Upload */}
                {editingPostId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Images
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploadingImages}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <Upload className="w-6 h-6 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {isUploadingImages
                            ? "Uploading..."
                            : "Click to upload images"}
                        </span>
                      </label>
                    </div>

                    {/* Uploaded Images Preview */}
                    {uploadedImages.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        {uploadedImages.map((img, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-video rounded-lg overflow-hidden bg-gray-100"
                          >
                            <img
                              src={img.url}
                              alt="Uploaded"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteImage(img.id)}
                              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Post"
                    )}
                  </Button>
                  {editingPostId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingPostId(null);
                        setTitle("");
                        setContent("");
                        setTags("");
                        setUploadedImages([]);
                        setLocation("/admin");
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Posts List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-light text-gray-900 mb-4">
                Your Posts
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {posts.length === 0 ? (
                  <p className="text-sm text-gray-500">No posts yet</p>
                ) : (
                  posts.map((post) => (
                    <div
                      key={post.id}
                      className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
                    >
                      <button
                        onClick={() => {
                          setEditingPostId(post.id);
                          setTitle(post.title);
                          setContent(post.content);
                          setTags(post.tags?.join(", ") || "");
                          setUploadedImages(
                            post.images?.map((img) => ({
                              id: img.id,
                              url: img.imageUrl,
                              key: img.imageKey,
                            })) || []
                          );
                        }}
                        className="w-full text-left mb-2"
                      >
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {post.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(post.createdAt).toLocaleDateString("zh-TW", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })}
                        </p>
                        {(post as any).author && (
                          <p className="text-xs text-gray-400 mt-1">
                            By {(post as any).author.name || "Anonymous"}
                          </p>
                        )}
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="w-full text-left text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
