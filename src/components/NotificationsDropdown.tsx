import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, Heart, MessageCircle, UserPlus, AtSign, UsersRound } from 'lucide-react';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'group_invite';
  actor_id: string;
  post_id: string | null;
  comment_id: string | null;
  group_id: string | null;
  read: boolean;
  created_at: string;
  actor?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export default function NotificationsDropdown() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();

      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      if (data) {
        const notificationsWithActors = await Promise.all(
          data.map(async (notif) => {
            const { data: actor } = await supabase
              .from('profiles')
              .select('username, display_name, avatar_url')
              .eq('id', notif.actor_id)
              .maybeSingle();

            return { ...notif, actor };
          })
        );

        setNotifications(notificationsWithActors as Notification[]);
        setUnreadCount(notificationsWithActors.filter((n) => !n.read).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-primary" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 text-green-500" />;
      case 'mention':
        return <AtSign className="w-4 h-4 text-purple-500" />;
      case 'group_invite':
        return <UsersRound className="w-4 h-4 text-orange-500" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getMessage = (notif: Notification) => {
    const name = notif.actor?.display_name || notif.actor?.username || 'Someone';
    switch (notif.type) {
      case 'like':
        return `${name} liked your post`;
      case 'comment':
        return `${name} commented on your post`;
      case 'follow':
        return `${name} started following you`;
      case 'mention':
        return `${name} mentioned you`;
      case 'group_invite':
        return `${name} invited you to a group`;
      default:
        return 'New notification';
    }
  };

  const getLink = (notif: Notification) => {
    if (notif.type === 'follow') {
      return `/profile/${notif.actor_id}`;
    }
    if (notif.type === 'group_invite' && notif.group_id) {
      return '/groups';
    }
    return '/';
  };

  if (!user) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No notifications</p>
          ) : (
            notifications.map((notif) => (
              <DropdownMenuItem key={notif.id} asChild>
                <Link
                  to={getLink(notif)}
                  onClick={() => {
                    if (!notif.read) markAsRead(notif.id);
                    setOpen(false);
                  }}
                  className={`flex items-start gap-3 p-3 cursor-pointer ${!notif.read ? 'bg-primary/5' : ''}`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={notif.actor?.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {notif.actor?.display_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getIcon(notif.type)}
                      <p className="text-sm line-clamp-2">{getMessage(notif)}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notif.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {!notif.read && <span className="w-2 h-2 bg-primary rounded-full" />}
                </Link>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
