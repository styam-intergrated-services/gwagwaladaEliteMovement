import { supabase } from '@/integrations/supabase/client';

export const createNotification = async (
  userId: string,
  type: 'like' | 'comment' | 'follow' | 'mention' | 'group_invite',
  actorId: string,
  postId?: string,
  commentId?: string,
  groupId?: string
) => {
  // Don't create notification if user is notifying themselves
  if (userId === actorId) return;

  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      type,
      actor_id: actorId,
      post_id: postId || null,
      comment_id: commentId || null,
      group_id: groupId || null
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};
