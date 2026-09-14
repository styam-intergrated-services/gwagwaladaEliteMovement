import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, UserMinus, Users } from "lucide-react";
import { createNotification } from "@/hooks/useNotifications";

interface FollowButtonProps {
  targetUserId: string;
  onFollowChange?: () => void;
}

export function FollowButton({ targetUserId, onFollowChange }: FollowButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user && user.id !== targetUserId) {
      checkFollowStatus();
    } else {
      setLoading(false);
    }
  }, [user, targetUserId]);

  const checkFollowStatus = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .maybeSingle();

    if (!error) {
      setIsFollowing(!!data);
    }
    setLoading(false);
  };

  const handleFollow = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Please sign in",
        description: "You need to be signed in to follow users",
      });
      return;
    }

    setActionLoading(true);

    if (isFollowing) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);

      if (error) {
        toast({ variant: "destructive", title: "Error unfollowing user" });
      } else {
        setIsFollowing(false);
        onFollowChange?.();
      }
    } else {
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: targetUserId,
        });

      if (error) {
        toast({ variant: "destructive", title: "Error following user" });
      } else {
        setIsFollowing(true);
        onFollowChange?.();
        toast({ title: "Following!" });
        createNotification(targetUserId, 'follow', user.id);
      }
    }

    setActionLoading(false);
  };

  // Don't show button for own profile or if not logged in
  if (!user || user.id === targetUserId) {
    return null;
  }

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Users className="w-4 h-4 mr-2" />
        Loading...
      </Button>
    );
  }

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      onClick={handleFollow}
      disabled={actionLoading}
      className={isFollowing ? "" : "gradient-primary text-white"}
    >
      {isFollowing ? (
        <>
          <UserMinus className="w-4 h-4 mr-2" />
          Unfollow
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-2" />
          Follow
        </>
      )}
    </Button>
  );
}

interface FollowStatsProps {
  userId: string;
}

export function FollowStats({ userId }: FollowStatsProps) {
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    const [followersRes, followingRes] = await Promise.all([
      supabase.from('follows').select('id', { count: 'exact' }).eq('following_id', userId),
      supabase.from('follows').select('id', { count: 'exact' }).eq('follower_id', userId),
    ]);

    setFollowers(followersRes.count || 0);
    setFollowing(followingRes.count || 0);
  };

  return (
    <div className="flex gap-6 text-sm text-muted-foreground">
      <span><strong className="text-foreground">{followers}</strong> followers</span>
      <span><strong className="text-foreground">{following}</strong> following</span>
    </div>
  );
}
