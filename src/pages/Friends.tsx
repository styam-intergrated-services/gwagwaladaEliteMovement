import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, UserMinus, Search, Users } from 'lucide-react';
import Navigation from '@/components/Navigation';

interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export default function Friends() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [followers, setFollowers] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<Profile[]>([]);
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchFollowers();
      fetchFollowing();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchFollowers = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('follows')
      .select('follower_id, profiles!follows_follower_id_fkey(*)')
      .eq('following_id', user.id);

    if (!error && data) {
      setFollowers(data.map(f => f.profiles as unknown as Profile));
    }
  };

  const fetchFollowing = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('follows')
      .select('following_id, profiles!follows_following_id_fkey(*)')
      .eq('follower_id', user.id);

    if (!error && data) {
      const profiles = data.map(f => f.profiles as unknown as Profile);
      setFollowing(profiles);
      setFollowingIds(new Set(profiles.map(p => p.id)));
    }
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
      .limit(20);

    if (!error) {
      setSearchResults((data || []).filter(p => p.id !== user?.id));
    }
    setSearching(false);
  };

  const handleFollow = async (profileId: string) => {
    if (!user) return;

    const isFollowing = followingIds.has(profileId);

    if (isFollowing) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profileId);

      if (!error) {
        setFollowingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(profileId);
          return newSet;
        });
        fetchFollowing();
      }
    } else {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: profileId });

      if (!error) {
        setFollowingIds(prev => new Set(prev).add(profileId));
        fetchFollowing();
        toast({ title: 'Now following!' });
      }
    }
  };

  const ProfileCard = ({ profile, showFollowButton = true }: { profile: Profile; showFollowButton?: boolean }) => (
    <Card className="border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <Link to={`/profile/${profile.id}`} className="flex items-center gap-3 hover:opacity-80">
            <Avatar className="w-12 h-12 border-2 border-primary">
              <AvatarImage src={profile.avatar_url || ''} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {(profile.display_name || profile.username || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{profile.display_name || profile.username || 'Anonymous'}</p>
              {profile.username && <p className="text-sm text-muted-foreground">@{profile.username}</p>}
            </div>
          </Link>
          {showFollowButton && user && profile.id !== user.id && (
            <Button
              variant={followingIds.has(profile.id) ? "outline" : "default"}
              size="sm"
              onClick={() => handleFollow(profile.id)}
              className={followingIds.has(profile.id) ? "" : "gradient-primary text-white"}
            >
              {followingIds.has(profile.id) ? (
                <><UserMinus className="w-4 h-4 mr-1" /> Unfollow</>
              ) : (
                <><UserPlus className="w-4 h-4 mr-1" /> Follow</>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 container mx-auto px-4 text-center">
          <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Friends</h1>
          <p className="text-muted-foreground mb-4">Sign in to see your friends and find new people to follow.</p>
          <Link to="/auth">
            <Button className="gradient-primary text-white">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24 pb-12 container mx-auto px-4 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Friends</h1>

        {/* Search */}
        <div className="flex gap-2 mb-6">
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="bg-background"
          />
          <Button onClick={handleSearch} disabled={searching} className="gradient-primary text-white">
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Search Results</h2>
            <div className="space-y-3">
              {searchResults.map(profile => (
                <ProfileCard key={profile.id} profile={profile} />
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="following" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted">
            <TabsTrigger value="following">Following ({following.length})</TabsTrigger>
            <TabsTrigger value="followers">Followers ({followers.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="following" className="mt-4">
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : following.length === 0 ? (
              <Card className="border-primary/20">
                <CardContent className="p-8 text-center text-muted-foreground">
                  You're not following anyone yet. Search for users above!
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {following.map(profile => (
                  <ProfileCard key={profile.id} profile={profile} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="followers" className="mt-4">
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : followers.length === 0 ? (
              <Card className="border-primary/20">
                <CardContent className="p-8 text-center text-muted-foreground">
                  No followers yet. Keep posting great content!
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {followers.map(profile => (
                  <ProfileCard key={profile.id} profile={profile} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
