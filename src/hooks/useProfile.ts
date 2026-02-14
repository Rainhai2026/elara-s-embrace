import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  subscription_status: string;
  daily_message_count: number;
  daily_image_count: number;
  last_message_date: string;
}

const MAX_FREE_MESSAGES = 50; // Augmenté pour le test
const MAX_PRO_IMAGES = 5;
const LOCAL_STORAGE_KEY = 'elara_guest_profile';

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const fetchProfile = useCallback(async () => {
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    let currentProfile: Profile = localData 
      ? JSON.parse(localData) 
      : { subscription_status: 'free', daily_message_count: 0, daily_image_count: 0, last_message_date: today };

    if (userId) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('subscription_status, daily_message_count, daily_image_count, last_message_date')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (!error && data) {
          currentProfile = data;
        }
      } catch (err) {
        console.warn("[useProfile] Supabase sync failed");
      }
    }

    if (currentProfile.last_message_date !== today) {
      currentProfile.daily_message_count = 0;
      currentProfile.daily_image_count = 0;
      currentProfile.last_message_date = today;
    }

    setProfile(currentProfile);
    setLoading(false);
  }, [userId, today]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const incrementMessageCount = async () => {
    if (!profile) return;
    const newCount = (profile.daily_message_count || 0) + 1;
    const updatedProfile = { ...profile, daily_message_count: newCount, last_message_date: today };
    setProfile(updatedProfile);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedProfile));
    if (userId) {
      await supabase.from('profiles').update({ daily_message_count: newCount, last_message_date: today }).eq('user_id', userId);
    }
  };

  const resetCounts = async () => {
    const resetProfile = { 
      subscription_status: 'free', 
      daily_message_count: 0, 
      daily_image_count: 0, 
      last_message_date: today 
    };
    setProfile(resetProfile);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(resetProfile));
    if (userId) {
      await supabase.from('profiles').update({ daily_message_count: 0, daily_image_count: 0 }).eq('user_id', userId);
    }
  };

  const remainingMessages = () => {
    if (profile?.subscription_status === 'pro' || profile?.subscription_status === 'extreme') return 999;
    return Math.max(0, MAX_FREE_MESSAGES - (profile?.daily_message_count ?? 0));
  };

  return { 
    profile, 
    loading, 
    incrementMessageCount, 
    resetCounts,
    remainingMessages, 
    canSendMessage: () => (profile?.subscription_status === 'pro' || profile?.subscription_status === 'extreme') || remainingMessages() > 0,
  };
}