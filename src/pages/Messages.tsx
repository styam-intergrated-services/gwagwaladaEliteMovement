import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Search, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';

interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  updated_at: string;
  other_user?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  last_message?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      
      const channel = supabase
        .channel(`messages:${selectedConversation.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${selectedConversation.id}`
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as Message]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const conversationsWithUsers = await Promise.all(
          data.map(async (conv) => {
            const otherUserId = conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1;
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, username, display_name, avatar_url')
              .eq('id', otherUserId)
              .maybeSingle();

            const { data: lastMsg } = await supabase
              .from('messages')
              .select('content')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            return {
              ...conv,
              other_user: profile,
              last_message: lastMsg?.content
            };
          })
        );
        setConversations(conversationsWithUsers);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      if (user) {
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .neq('sender_id', user.id)
          .is('read_at', null);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .neq('id', user.id)
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const startConversation = async (otherUserId: string) => {
    if (!user) return;

    try {
      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .or(`and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`)
        .maybeSingle();

      if (existing) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .eq('id', otherUserId)
          .maybeSingle();

        setSelectedConversation({ ...existing, other_user: profile });
        setSearchQuery('');
        setSearchResults([]);
        return;
      }

      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({ participant_1: user.id, participant_2: otherUserId })
        .select()
        .single();

      if (error) throw error;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .eq('id', otherUserId)
        .maybeSingle();

      setSelectedConversation({ ...newConv, other_user: profile });
      setSearchQuery('');
      setSearchResults([]);
      fetchConversations();
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({ title: 'Error starting conversation', variant: 'destructive' });
    }
  };

  const sendMessage = async () => {
    if (!user || !selectedConversation || !newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          content: newMessage
        });

      if (error) throw error;

      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedConversation.id);

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({ title: 'Error sending message', variant: 'destructive' });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 pb-12 container mx-auto px-4 max-w-2xl text-center">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-bold mb-2">Sign in to access Messages</h1>
          <p className="text-muted-foreground">Send private messages to your friends.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24 pb-12 container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Messages</h1>

        <div className="grid md:grid-cols-3 gap-4 h-[600px]">
          {/* Conversations List */}
          <Card className={`${selectedConversation ? 'hidden md:block' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button variant="outline" size="icon" onClick={handleSearch}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {searchResults.length > 0 ? (
                  <div className="p-2 space-y-1">
                    <p className="text-xs text-muted-foreground px-2 py-1">Search Results</p>
                    {searchResults.map((profile) => (
                      <button
                        key={profile.id}
                        onClick={() => startConversation(profile.id)}
                        className="w-full flex items-center gap-3 p-2 hover:bg-muted rounded-lg transition-colors"
                      >
                        <Avatar>
                          <AvatarImage src={profile.avatar_url || ''} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {profile.display_name?.charAt(0) || profile.username?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{profile.display_name || profile.username}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="divide-y">
                    {conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv)}
                        className={`w-full flex items-center gap-3 p-4 hover:bg-muted transition-colors ${
                          selectedConversation?.id === conv.id ? 'bg-muted' : ''
                        }`}
                      >
                        <Avatar>
                          <AvatarImage src={conv.other_user?.avatar_url || ''} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {conv.other_user?.display_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left">
                          <p className="font-medium">
                            {conv.other_user?.display_name || conv.other_user?.username || 'User'}
                          </p>
                          {conv.last_message && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{conv.last_message}</p>
                          )}
                        </div>
                      </button>
                    ))}
                    {conversations.length === 0 && !loading && (
                      <p className="text-center text-muted-foreground py-8">No conversations yet</p>
                    )}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className={`md:col-span-2 ${!selectedConversation ? 'hidden md:flex md:items-center md:justify-center' : ''}`}>
            {selectedConversation ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden"
                      onClick={() => setSelectedConversation(null)}
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <Avatar>
                      <AvatarImage src={selectedConversation.other_user?.avatar_url || ''} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {selectedConversation.other_user?.display_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-lg">
                      {selectedConversation.other_user?.display_name || selectedConversation.other_user?.username}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex flex-col h-[480px]">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                              msg.sender_id === user.id
                                ? 'gradient-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p>{msg.content}</p>
                            <p className={`text-xs mt-1 ${msg.sender_id === user.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                  <div className="p-4 border-t flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <Button onClick={sendMessage} className="gradient-primary text-primary-foreground">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <div className="text-center text-muted-foreground">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to start messaging</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
