import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Send, Trash2 } from "lucide-react";
import { createNotification } from "@/hooks/useNotifications";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface CommentsSectionProps {
  postId: string;
  postOwnerId: string;
  commentsCount: number;
}

export function CommentsSection({ postId, postOwnerId, commentsCount }: CommentsSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (isExpanded) {
      fetchComments();
    }
  }, [isExpanded, postId]);

  const fetchComments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
    } else {
      setComments(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!user || !newComment.trim()) return;

    setSubmitting(true);
    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content: newComment.trim(),
      })
      .select()
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Error posting comment",
        description: error.message,
      });
    } else {
      setNewComment("");
      fetchComments();
      
      // Create notification for post owner
      if (postOwnerId !== user.id) {
        createNotification(postOwnerId, 'comment', user.id, postId, data.id);
      }
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error deleting comment",
      });
    } else {
      fetchComments();
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
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  if (!isExpanded) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(true)}
        className="text-muted-foreground hover:text-primary mt-2"
      >
        {commentsCount > 0 ? `View ${commentsCount} comment${commentsCount > 1 ? 's' : ''}` : 'Add a comment'}
      </Button>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
      {/* Comment Input */}
      {user && (
        <div className="flex gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary/20 text-primary text-xs">
              {user.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 flex gap-2">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="resize-none bg-background/50 border-border/50 min-h-[40px] py-2"
              rows={1}
            />
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!newComment.trim() || submitting}
              className="gradient-primary text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="text-sm text-muted-foreground">No comments yet</div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 group">
              <Link to={`/profile/${comment.user_id}`}>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={comment.profiles?.avatar_url || ''} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {(comment.profiles?.display_name || comment.profiles?.username || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1">
                <div className="bg-muted/50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Link to={`/profile/${comment.user_id}`} className="font-semibold text-sm hover:underline">
                      {comment.profiles?.display_name || comment.profiles?.username || 'Anonymous'}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{comment.content}</p>
                </div>
              </div>
              {user?.id === comment.user_id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(comment.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(false)}
        className="text-muted-foreground text-xs"
      >
        Hide comments
      </Button>
    </div>
  );
}
