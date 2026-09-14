import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Camera,
  Edit2,
  Save,
  X,
  Heart,
  ArrowLeft,
  MapPin,
  Link as LinkIcon,
  CalendarDays,
  Grid3X3,
  Rows3,
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import { FollowButton, FollowStats } from '@/components/FollowButton';

interface ProfileData {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  created_at?: string | null;
}

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  likes_count: number;
  created_at: string;
}

export default function Profile() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: '',
    bio: '',
    location: '',
    website: '',
  });
  const [uploading, setUploading] = useState(false);

  const profileId = userId || user?.id;
  const isOwnProfile = user?.id === profileId;

  useEffect(() => {
    if (profileId) {
      fetchProfile();
      fetchPosts();
    }
  }, [profileId]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      toast({ variant: 'destructive', title: 'Error loading profile' });
    } else if (data) {
      setProfile(data as ProfileData);
      setEditForm({
        display_name: data.display_name || '',
        bio: data.bio || '',
        location: (data as ProfileData).location || '',
        website: (data as ProfileData).website || '',
      });
    }
    setLoading(false);
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', profileId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
    } else {
      setPosts(data || []);
    }
  };

  const handleSaveProfile = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: editForm.display_name,
        bio: editForm.bio,
        location: editForm.location,
        website: editForm.website,
      })
      .eq('id', user?.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error updating profile' });
    } else {
      setProfile((prev) => (prev ? { ...prev, ...editForm } : null));
      setIsEditing(false);
      toast({ title: 'Profile updated!' });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({ variant: 'destructive', title: 'Error uploading avatar' });
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);

    if (updateError) {
      toast({ variant: 'destructive', title: 'Error updating profile' });
    } else {
      setProfile((prev) => (prev ? { ...prev, avatar_url: publicUrl } : null));
      toast({ title: 'Avatar updated!' });
    }
    setUploading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 flex flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Profile not found</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  const name = profile.display_name || profile.username || 'Anonymous';
  const totalLikes = posts.reduce((sum, p) => sum + (p.likes_count || 0), 0);
  const joined = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20 pb-24">
        <div className="container mx-auto max-w-4xl px-4">
          <Button variant="ghost" onClick={() => navigate('/')} className="my-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Feed
          </Button>

          {/* Header card with cover */}
          <Card className="overflow-hidden border-primary/20">
            <div className="h-32 w-full gradient-primary sm:h-40" />
            <CardContent className="p-6 pt-0">
              <div className="-mt-14 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="relative w-fit">
                  <Avatar className="h-28 w-28 border-4 border-background shadow-lg">
                    <AvatarImage src={profile.avatar_url || ''} alt={name} />
                    <AvatarFallback className="bg-primary text-3xl text-primary-foreground">
                      {name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isOwnProfile && (
                    <label className="absolute bottom-1 right-1 cursor-pointer rounded-full bg-primary p-2 transition-colors hover:bg-primary/90">
                      <Camera className="h-4 w-4 text-primary-foreground" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={uploading}
                      />
                    </label>
                  )}
                </div>

                {!isEditing && (
                  <div className="flex flex-wrap gap-2 sm:mb-2">
                    <FollowButton targetUserId={profileId!} />
                    {isOwnProfile && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="gap-2"
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit profile
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Display name</label>
                    <Input
                      value={editForm.display_name}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, display_name: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Bio</label>
                    <Textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm((p) => ({ ...p, bio: e.target.value }))}
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm text-muted-foreground">Location</label>
                      <Input
                        placeholder="Gwagwalada, Abuja"
                        value={editForm.location}
                        onChange={(e) =>
                          setEditForm((p) => ({ ...p, location: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Website</label>
                      <Input
                        placeholder="https://"
                        value={editForm.website}
                        onChange={(e) =>
                          setEditForm((p) => ({ ...p, website: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveProfile} className="gap-2">
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  <h1 className="text-2xl font-bold text-foreground">{name}</h1>
                  {profile.username && (
                    <p className="text-muted-foreground">@{profile.username}</p>
                  )}
                  <p className="mt-3 text-foreground">{profile.bio || 'No bio yet'}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    {profile.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        {profile.location}
                      </span>
                    )}
                    {profile.website && (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-primary hover:underline"
                      >
                        <LinkIcon className="h-4 w-4" />
                        {profile.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                    {joined && (
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="h-4 w-4" />
                        Joined {joined}
                      </span>
                    )}
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-border p-3 text-center">
                      <p className="text-lg font-bold text-foreground">{posts.length}</p>
                      <p className="text-xs text-muted-foreground">Posts</p>
                    </div>
                    <div className="rounded-xl border border-border p-3 text-center">
                      <p className="text-lg font-bold text-foreground">{totalLikes}</p>
                      <p className="text-xs text-muted-foreground">Likes</p>
                    </div>
                    <div className="flex items-center justify-center gap-4 rounded-xl border border-border p-3 text-center text-sm">
                      <FollowStats userId={profileId!} />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Posts */}
          <Tabs defaultValue="grid" className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Posts</h2>
              <TabsList>
                <TabsTrigger value="grid" className="gap-1.5">
                  <Grid3X3 className="h-4 w-4" />
                  Grid
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-1.5">
                  <Rows3 className="h-4 w-4" />
                  List
                </TabsTrigger>
              </TabsList>
            </div>

            {posts.length === 0 ? (
              <Card className="border-primary/20">
                <CardContent className="p-8 text-center text-muted-foreground">
                  {isOwnProfile ? "You haven't posted anything yet" : 'No posts yet'}
                </CardContent>
              </Card>
            ) : (
              <>
                <TabsContent value="grid">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {posts.map((post) => (
                      <Card key={post.id} className="overflow-hidden border-primary/20">
                        {post.image_url ? (
                          <img
                            src={post.image_url}
                            alt={post.content.slice(0, 60) || 'Post image'}
                            loading="lazy"
                            className="aspect-square w-full object-cover"
                          />
                        ) : (
                          <div className="flex aspect-square items-center justify-center bg-muted p-3">
                            <p className="line-clamp-4 text-center text-xs text-muted-foreground">
                              {post.content}
                            </p>
                          </div>
                        )}
                        <div className="flex items-center gap-1 p-2 text-xs text-muted-foreground">
                          <Heart className="h-3.5 w-3.5" />
                          {post.likes_count}
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="list">
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <Card key={post.id} className="border-primary/20">
                        <CardContent className="p-4">
                          <p className="mb-3 text-foreground">{post.content}</p>
                          {post.image_url && (
                            <img
                              src={post.image_url}
                              alt={post.content.slice(0, 60) || 'Post image'}
                              loading="lazy"
                              className="mb-3 max-h-96 w-full rounded-lg object-cover"
                            />
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <Badge variant="secondary" className="gap-1">
                              <Heart className="h-3.5 w-3.5" />
                              {post.likes_count}
                            </Badge>
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
