import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UsersRound, Plus, Send, Image, Users, MoreVertical, Trash2, UserMinus, Edit, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';

interface Group {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  created_by: string;
  member_count?: number;
  is_member?: boolean;
  role?: string;
}

interface GroupMember {
  id: string;
  user_id: string;
  role: string;
  profile?: { username: string | null; display_name: string | null; avatar_url: string | null };
}

interface GroupPost {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  user_id: string;
  profile?: { username: string | null; display_name: string | null; avatar_url: string | null };
}

export default function Groups() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupPosts, setGroupPosts] = useState<GroupPost[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [postImage, setPostImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [activeTab, setActiveTab] = useState('posts');

  useEffect(() => { fetchGroups(); }, [user]);
  useEffect(() => { if (selectedGroup) { fetchGroupPosts(selectedGroup.id); fetchGroupMembers(selectedGroup.id); } }, [selectedGroup]);

  const fetchGroups = async () => {
    const { data: groupsData } = await supabase.from('groups').select('*').order('created_at', { ascending: false });
    if (groupsData && user) {
      const { data: memberships } = await supabase.from('group_members').select('group_id, role').eq('user_id', user.id);
      const membershipMap = new Map(memberships?.map(m => [m.group_id, m.role]) || []);
      const enriched = await Promise.all(groupsData.map(async (g) => {
        const { count } = await supabase.from('group_members').select('*', { count: 'exact', head: true }).eq('group_id', g.id);
        return { ...g, member_count: count || 0, is_member: membershipMap.has(g.id), role: membershipMap.get(g.id) };
      }));
      setGroups(enriched);
    } else { setGroups(groupsData || []); }
    setLoading(false);
  };

  const fetchGroupPosts = async (groupId: string) => {
    const { data } = await supabase.from('group_posts').select('*').eq('group_id', groupId).order('created_at', { ascending: false });
    if (data) {
      const posts = await Promise.all(data.map(async (p) => {
        const { data: profile } = await supabase.from('profiles').select('username, display_name, avatar_url').eq('id', p.user_id).maybeSingle();
        return { ...p, profile };
      }));
      setGroupPosts(posts);
    }
  };

  const fetchGroupMembers = async (groupId: string) => {
    const { data } = await supabase.from('group_members').select('*').eq('group_id', groupId);
    if (data) {
      const members = await Promise.all(data.map(async (m) => {
        const { data: profile } = await supabase.from('profiles').select('username, display_name, avatar_url').eq('id', m.user_id).maybeSingle();
        return { ...m, profile };
      }));
      setGroupMembers(members);
    }
  };

  const handleCreateGroup = async () => {
    if (!user || !newGroupName.trim()) return;
    const { data: group } = await supabase.from('groups').insert({ name: newGroupName, description: newGroupDescription, created_by: user.id }).select().single();
    if (group) { await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id, role: 'admin' }); }
    toast({ title: 'Group created!' }); setNewGroupName(''); setNewGroupDescription(''); setCreateDialogOpen(false); fetchGroups();
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!user) return;
    await supabase.from('group_members').insert({ group_id: groupId, user_id: user.id });
    toast({ title: 'Joined group!' }); fetchGroups();
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!user) return;
    await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', user.id);
    toast({ title: 'Left group' }); if (selectedGroup?.id === groupId) { setSelectedGroup(null); } fetchGroups();
  };

  const handleEditGroup = async () => {
    if (!selectedGroup || !editName.trim()) return;
    await supabase.from('groups').update({ name: editName, description: editDescription }).eq('id', selectedGroup.id);
    toast({ title: 'Group updated!' }); setEditDialogOpen(false); setSelectedGroup({ ...selectedGroup, name: editName, description: editDescription }); fetchGroups();
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup || selectedGroup.created_by !== user?.id) return;
    await supabase.from('groups').delete().eq('id', selectedGroup.id);
    toast({ title: 'Group deleted' }); setSelectedGroup(null); fetchGroups();
  };

  const handleRemoveMember = async (memberId: string, memberUserId: string) => {
    if (!user || memberUserId === user.id) return;
    await supabase.from('group_members').delete().eq('id', memberId);
    toast({ title: 'Member removed' }); if (selectedGroup) fetchGroupMembers(selectedGroup.id);
  };

  const handleCreatePost = async () => {
    if (!user || !selectedGroup || !newPostContent.trim()) return;
    let imageUrl = null;
    if (postImage) {
      const fileName = `${user.id}/${Date.now()}.${postImage.name.split('.').pop()}`;
      await supabase.storage.from('post-images').upload(fileName, postImage);
      imageUrl = supabase.storage.from('post-images').getPublicUrl(fileName).data.publicUrl;
    }
    await supabase.from('group_posts').insert({ group_id: selectedGroup.id, user_id: user.id, content: newPostContent, image_url: imageUrl });
    toast({ title: 'Post created!' }); setNewPostContent(''); setPostImage(null); fetchGroupPosts(selectedGroup.id);
  };

  const isAdmin = selectedGroup?.role === 'admin' || selectedGroup?.created_by === user?.id;

  if (!user) return <div className="min-h-screen bg-background"><Navigation /><div className="pt-24 container mx-auto px-4 text-center"><UsersRound className="w-16 h-16 mx-auto mb-4 text-primary" /><h1 className="text-2xl font-bold">Sign in to access Groups</h1></div></div>;

  if (selectedGroup) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 pb-12 container mx-auto px-4 max-w-3xl">
          <Button variant="ghost" onClick={() => setSelectedGroup(null)} className="mb-4">← Back</Button>
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16"><AvatarFallback className="bg-primary text-primary-foreground text-xl">{selectedGroup.name.charAt(0)}</AvatarFallback></Avatar>
                <div className="flex-1"><CardTitle>{selectedGroup.name}</CardTitle><p className="text-muted-foreground text-sm">{selectedGroup.description}</p><p className="text-sm text-muted-foreground"><Users className="w-4 h-4 inline mr-1" />{groupMembers.length} members</p></div>
                {isAdmin && (
                  <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="icon"><Settings className="w-4 h-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditName(selectedGroup.name); setEditDescription(selectedGroup.description || ''); setEditDialogOpen(true); }}><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleDeleteGroup} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Button variant="outline" onClick={() => handleLeaveGroup(selectedGroup.id)}>Leave</Button>
              </div>
            </CardHeader>
          </Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="posts">Posts</TabsTrigger><TabsTrigger value="members">Members</TabsTrigger></TabsList>
            <TabsContent value="posts" className="mt-4">
              <Card className="mb-4"><CardContent className="pt-6"><Textarea placeholder="Share something..." value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} className="mb-3" /><div className="flex items-center gap-2"><label className="cursor-pointer"><Input type="file" accept="image/*" className="hidden" onChange={(e) => setPostImage(e.target.files?.[0] || null)} /><Image className="w-5 h-5 text-muted-foreground" /></label><Button onClick={handleCreatePost} className="ml-auto"><Send className="w-4 h-4 mr-2" />Post</Button></div></CardContent></Card>
              <div className="space-y-4">{groupPosts.map((post) => <Card key={post.id}><CardContent className="pt-6"><div className="flex items-start gap-3"><Avatar><AvatarFallback>{post.profile?.display_name?.charAt(0) || 'U'}</AvatarFallback></Avatar><div><p className="font-medium">{post.profile?.display_name || 'User'}</p><p className="text-sm text-muted-foreground">{new Date(post.created_at).toLocaleDateString()}</p><p className="mt-2">{post.content}</p>{post.image_url && <img src={post.image_url} className="mt-3 rounded-lg max-h-80" />}</div></div></CardContent></Card>)}</div>
            </TabsContent>
            <TabsContent value="members" className="mt-4">
              <Card><CardContent className="pt-6"><ScrollArea className="h-[400px]"><div className="space-y-3">{groupMembers.map((m) => <div key={m.id} className="flex items-center gap-3 p-3 border rounded-lg"><Avatar><AvatarFallback>{m.profile?.display_name?.charAt(0) || 'U'}</AvatarFallback></Avatar><div className="flex-1"><p className="font-medium">{m.profile?.display_name || 'User'}</p><p className="text-sm text-muted-foreground capitalize">{m.role}</p></div>{isAdmin && m.user_id !== user.id && <Button variant="ghost" size="icon" onClick={() => handleRemoveMember(m.id, m.user_id)}><UserMinus className="w-4 h-4 text-destructive" /></Button>}</div>)}</div></ScrollArea></CardContent></Card>
            </TabsContent>
          </Tabs>
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}><DialogContent><DialogHeader><DialogTitle>Edit Group</DialogTitle></DialogHeader><div className="space-y-4 mt-4"><Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Name" /><Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Description" /><Button onClick={handleEditGroup} className="w-full">Save</Button></div></DialogContent></Dialog>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24 pb-12 container mx-auto px-4 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Groups</h1>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}><DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Create</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Create Group</DialogTitle></DialogHeader><div className="space-y-4 mt-4"><Input placeholder="Name" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} /><Textarea placeholder="Description" value={newGroupDescription} onChange={(e) => setNewGroupDescription(e.target.value)} /><Button onClick={handleCreateGroup} className="w-full">Create</Button></div></DialogContent></Dialog>
        </div>
        {loading ? <p className="text-center text-muted-foreground">Loading...</p> : groups.length === 0 ? <Card><CardContent className="p-12 text-center"><UsersRound className="w-16 h-16 mx-auto mb-4 text-primary" /><h2 className="text-xl font-semibold">No groups yet</h2></CardContent></Card> : (
          <div className="space-y-4">{groups.map((g) => <Card key={g.id}><CardContent className="p-4"><div className="flex items-center gap-4"><Avatar className="h-14 w-14"><AvatarFallback className="bg-primary text-primary-foreground">{g.name.charAt(0)}</AvatarFallback></Avatar><div className="flex-1"><h3 className="font-semibold">{g.name}</h3><p className="text-sm text-muted-foreground">{g.member_count} members{g.role === 'admin' && <span className="ml-2 text-primary">• Admin</span>}</p></div>{g.is_member ? <Button onClick={() => setSelectedGroup(g)}>View</Button> : <Button variant="outline" onClick={() => handleJoinGroup(g.id)}>Join</Button>}</div></CardContent></Card>)}</div>
        )}
      </div>
    </div>
  );
}
