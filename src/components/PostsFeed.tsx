import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, Image as ImageIcon, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { CommentsSection } from "./CommentsSection";
import { createNotification } from "@/hooks/useNotifications";

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  profiles: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

const PostsFeed = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPosts();
    if (user) {
      fetchUserLikes();
    }

    // Subscribe to realtime updates
    const channel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        () => {
          fetchPosts();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_likes' },
        () => {
          fetchPosts();
          if (user) fetchUserLikes();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  const fetchUserLikes = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', user.id);

    if (!error && data) {
      setUserLikes(new Set(data.map(like => like.post_id)));
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Image too large",
          description: "Please select an image under 5MB",
        });
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreatePost = async () => {
    if (!user || (!newPost.trim() && !selectedImage)) return;

    setPosting(true);
    let imageUrl = null;

    // Upload image if selected
    if (selectedImage) {
      const fileExt = selectedImage.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(filePath, selectedImage);

      if (uploadError) {
        toast({
          variant: "destructive",
          title: "Error uploading image",
          description: uploadError.message,
        });
        setPosting(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(filePath);
      
      imageUrl = publicUrl;
    }

    const { error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        content: newPost.trim() || '',
        image_url: imageUrl,
      });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error creating post",
        description: error.message,
      });
    } else {
      setNewPost("");
      removeSelectedImage();
      toast({ title: "Post created!" });
    }
    setPosting(false);
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Please sign in",
        description: "You need to be signed in to like posts",
      });
      return;
    }

    const isLiked = userLikes.has(postId);

    if (isLiked) {
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (!error) {
        setUserLikes(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      }
    } else {
      const { error } = await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: user.id,
        });

      if (!error) {
        setUserLikes(prev => new Set(prev).add(postId));
        
        // Create notification for post owner
        const post = posts.find(p => p.id === postId);
        if (post && post.user_id !== user.id) {
          createNotification(post.user_id, 'like', user.id, postId);
        }
      }
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  return (
    <section className="py-16">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Latest
            <span className="text-gradient"> Posts</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Stay connected with what's happening in your community. Share, like, and engage with posts from friends and neighbors.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Create Post */}
          {user && (
            <Card className="shadow-soft border-0 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src="" />
                    <AvatarFallback className="gradient-primary text-white">
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <Textarea
                      placeholder="What's on your mind?"
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      className="resize-none bg-background/50 border-border/50"
                      rows={3}
                    />
                    
                    {/* Image Preview */}
                    {imagePreview && (
                      <div className="relative inline-block">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="max-h-40 rounded-lg object-cover"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={removeSelectedImage}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-muted-foreground"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <ImageIcon className="w-5 h-5 mr-2" />
                          Photo
                        </Button>
                      </div>
                      <Button 
                        onClick={handleCreatePost}
                        disabled={(!newPost.trim() && !selectedImage) || posting}
                        className="gradient-primary text-white"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {posting ? 'Posting...' : 'Post'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Posts List */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading posts...</div>
          ) : posts.length === 0 ? (
            <Card className="shadow-soft border-0 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-8 text-center text-muted-foreground">
                No posts yet. Be the first to share something!
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="shadow-soft hover:shadow-glow transition-all duration-300 border-0 bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <Link to={`/profile/${post.user_id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={post.profiles?.avatar_url || ''} />
                        <AvatarFallback className="gradient-primary text-white font-semibold">
                          {(post.profiles?.display_name || post.profiles?.username || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {post.profiles?.display_name || post.profiles?.username || 'Anonymous'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {formatTimeAgo(post.created_at)}
                        </p>
                      </div>
                    </Link>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {post.content && (
                    <p className="text-foreground mb-4 leading-relaxed">{post.content}</p>
                  )}
                  
                  {post.image_url && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img 
                        src={post.image_url} 
                        alt="Post content" 
                        className="w-full max-h-[500px] object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-6">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleLike(post.id)}
                        className={`group ${userLikes.has(post.id) ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                      >
                        <Heart className={`w-5 h-5 mr-2 transition-all ${userLikes.has(post.id) ? 'fill-current' : 'group-hover:fill-current'}`} />
                        {post.likes_count}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                        <MessageCircle className="w-5 h-5 mr-2" />
                        {post.comments_count || 0}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                        <Share2 className="w-5 h-5 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>

                  {/* Comments Section */}
                  <CommentsSection postId={post.id} postOwnerId={post.user_id} commentsCount={post.comments_count || 0} />
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {!user && (
          <div className="text-center mt-12">
            <Link to="/auth">
              <Button size="lg" className="gradient-primary text-white px-8 py-6 text-lg">
                Join to Start Posting
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default PostsFeed;
