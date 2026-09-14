import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { createNotification } from "@/hooks/useNotifications";
import { Heart, MessageCircle, Share2, Image, Trash2, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { CommentsSection } from "@/components/CommentsSection";

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  user_id: string;
  likes_count: number;
  comments_count: number;
  profile?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  is_liked?: boolean;
}

const Posts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [followingPosts, setFollowingPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchPosts();
    if (user) {
      fetchFollowingPosts();
    }
  }, [user]);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      await enrichPosts(data, setPosts);
    }
    setLoading(false);
  };

  const fetchFollowingPosts = async () => {
    if (!user) return;

    const { data: following } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);

    if (!following || following.length === 0) {
      setFollowingPosts([]);
      return;
    }

    const followingIds = following.map((f) => f.following_id);

    const { data } = await supabase
      .from("posts")
      .select("*")
      .in("user_id", followingIds)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      await enrichPosts(data, setFollowingPosts);
    }
  };

  const enrichPosts = async (postsData: any[], setter: (posts: Post[]) => void) => {
    const userIds = [...new Set(postsData.map((p) => p.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", userIds);

    let likedPostIds: string[] = [];
    if (user) {
      const { data: likes } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", postsData.map((p) => p.id));

      likedPostIds = likes?.map((l) => l.post_id) || [];
    }

    const enrichedPosts = postsData.map((post) => ({
      ...post,
      profile: profiles?.find((p) => p.id === post.user_id),
      is_liked: likedPostIds.includes(post.id),
    }));

    setter(enrichedPosts);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const createPost = async () => {
    if (!user || !newPostContent.trim()) return;

    setUploading(true);
    let imageUrl = null;

    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(fileName, imageFile);

      if (uploadError) {
        toast({ title: "Error uploading image", variant: "destructive" });
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("post-images")
        .getPublicUrl(fileName);

      imageUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from("posts").insert({
      user_id: user.id,
      content: newPostContent,
      image_url: imageUrl,
    });

    if (error) {
      toast({ title: "Error creating post", variant: "destructive" });
      setUploading(false);
      return;
    }

    setNewPostContent("");
    setImageFile(null);
    setImagePreview(null);
    setUploading(false);
    fetchPosts();
    toast({ title: "Post created!" });
  };

  const toggleLike = async (post: Post) => {
    if (!user) {
      toast({ title: "Please sign in to like posts" });
      return;
    }

    if (post.is_liked) {
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", user.id);
    } else {
      await supabase.from("post_likes").insert({
        post_id: post.id,
        user_id: user.id,
      });

      if (post.user_id !== user.id) {
        await createNotification(post.user_id, "like", user.id, post.id);
      }
    }

    // Update local state
    const updatePosts = (prevPosts: Post[]) =>
      prevPosts.map((p) =>
        p.id === post.id
          ? {
              ...p,
              is_liked: !p.is_liked,
              likes_count: p.is_liked ? p.likes_count - 1 : p.likes_count + 1,
            }
          : p
      );

    setPosts(updatePosts);
    setFollowingPosts(updatePosts);
  };

  const deletePost = async (postId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId)
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Error deleting post", variant: "destructive" });
      return;
    }

    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setFollowingPosts((prev) => prev.filter((p) => p.id !== postId));
    toast({ title: "Post deleted" });
  };

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  const sharePost = async (post: Post) => {
    const url = `${window.location.origin}/posts/${post.id}`;
    if (navigator.share) {
      await navigator.share({
        title: `Post by ${post.profile?.display_name || post.profile?.username}`,
        text: post.content.substring(0, 100),
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied to clipboard!" });
    }
  };

  const renderPost = (post: Post) => (
    <Card key={post.id}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Link
            to={`/profile/${post.user_id}`}
            className="flex items-center gap-3 hover:opacity-80"
          >
            <Avatar>
              <AvatarImage src={post.profile?.avatar_url || undefined} />
              <AvatarFallback>
                {(post.profile?.display_name || post.profile?.username || "U")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">
                {post.profile?.display_name || post.profile?.username || "User"}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(post.created_at), "MMM d, yyyy • HH:mm")}
              </p>
            </div>
          </Link>
          {user?.id === post.user_id && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => deletePost(post.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-4 whitespace-pre-wrap">{post.content}</p>
        {post.image_url && (
          <img
            src={post.image_url}
            alt="Post"
            className="rounded-lg mb-4 max-h-96 w-full object-cover"
          />
        )}
        <div className="flex items-center gap-4 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleLike(post)}
            className={post.is_liked ? "text-red-500" : ""}
          >
            <Heart className={`h-4 w-4 mr-1 ${post.is_liked ? "fill-current" : ""}`} />
            {post.likes_count}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleComments(post.id)}
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            {post.comments_count}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => sharePost(post)}
          >
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
        </div>
        {expandedComments.has(post.id) && (
          <CommentsSection
            postId={post.id}
            postOwnerId={post.user_id}
            commentsCount={post.comments_count}
          />
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Posts</h1>

        {/* Create Post */}
        {user && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <Textarea
                placeholder="What's on your mind?"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="mb-4"
                rows={3}
              />
              {imagePreview && (
                <div className="relative mb-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="rounded-lg max-h-64 object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="flex justify-between items-center">
                <label className="cursor-pointer">
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  <Button variant="outline" size="sm" asChild>
                    <span>
                      <Image className="h-4 w-4 mr-2" />
                      Add Photo
                    </span>
                  </Button>
                </label>
                <Button
                  onClick={createPost}
                  disabled={!newPostContent.trim() || uploading}
                >
                  {uploading ? "Posting..." : "Post"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Posts Feed */}
        <Tabs defaultValue="all">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="all" className="flex-1">All Posts</TabsTrigger>
            <TabsTrigger value="following" className="flex-1" disabled={!user}>
              Following
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <div className="space-y-4">
              {posts.map(renderPost)}
              {posts.length === 0 && !loading && (
                <p className="text-center text-muted-foreground py-8">
                  No posts yet. Be the first to post!
                </p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="following">
            <div className="space-y-4">
              {followingPosts.map(renderPost)}
              {followingPosts.length === 0 && !loading && (
                <p className="text-center text-muted-foreground py-8">
                  No posts from people you follow yet.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Posts;
