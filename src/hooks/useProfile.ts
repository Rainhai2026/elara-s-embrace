import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  subscription_status: string;
  daily_message_count: number;
  last_message_date: string;
}

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('subscription_status, daily_message_count, last_message_date')
        .eq('user_id', userId)
        .maybeSingle();
      
      setProfile(data);
      setLoading(false);
    };

    fetchProfile();
  }, [userId]);

  const incrementMessageCount = async () => {
    if (!userId || !profile) return;

    const today = new Date().toISOString().split('T')[0];
    const isNewDay = profile.last_message_date !== today;

    const newCount = isNewDay ? 1 : profile.daily_message_count + 1;

    await supabase
      .from('profiles')
      .update({
        daily_message_count: newCount,
        last_message_date: today,
      })
      .eq('user_id', userId);

    setProfile(prev => prev ? { ...prev, daily_message_count: newCount, last_message_date: today } : null);
  };

  const canSendMessage = () => {
    if (!profile) return false;
    const today = new Date().toISOString().split('T')[0];
    if (profile.last_message_date !== today) return true;
    return profile.daily_message_count < 25;
  };

  const remainingMessages = () => {
    if (!profile) return 0;
    const today = new Date().toISOString().split('T')[0];
    if (profile.last_message_date !== today) return 25;
    return Math.max(0, 25 - profile.daily_message_count);
  };

  return { profile, loading, incrementMessageCount, canSendMessage, remainingMessages };
}
