import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  subscription_status: string;
  daily_message_count: number;
  last_message_date: string;
}

const MAX_FREE_MESSAGES = 15;

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    
    try {
      console.log("[useProfile] Fetching profile for:", userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_status, daily_message_count, last_message_date')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;

      if (!data) {
        console.log("[useProfile] No profile found, creating one...");
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([{ 
            user_id: userId, 
            subscription_status: 'free',
            daily_message_count: 0,
            last_message_date: today
          }])
          .select()
          .single();
        
        if (insertError) throw insertError;
        setProfile(newProfile);
      } else {
        // Reset journalier si nécessaire
        if (data.last_message_date !== today) {
          console.log("[useProfile] New day detected, resetting count locally");
          setProfile({ ...data, daily_message_count: 0, last_message_date: today });
        } else {
          setProfile(data);
        }
      }
    } catch (err) {
      console.error("[useProfile] Error:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, today]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const incrementMessageCount = async () => {
    if (!userId) return;

    const currentCount = profile?.daily_message_count ?? 0;
    const newCount = currentCount + 1;

    console.log(`[useProfile] Incrementing count: ${currentCount} -> ${newCount}`);

    // MISE À JOUR FORCEE ET IMMEDIATE
    setProfile(prev => ({
      subscription_status: prev?.subscription_status ?? 'free',
      daily_message_count: newCount,
      last_message_date: today
    }));

    try {
      await supabase
        .from('profiles')
        .update({
          daily_message_count: newCount,
          last_message_date: today,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    } catch (err) {
      console.error("[useProfile] Sync error:", err);
    }
  };

  const remainingMessages = () => {
    if (profile?.subscription_status === 'pro' || profile?.subscription_status === 'extreme') return 999;
    const count = profile?.daily_message_count ?? 0;
    return Math.max(0, MAX_FREE_MESSAGES - count);
  };

  const canSendMessage = () => {
    if (profile?.subscription_status === 'pro' || profile?.subscription_status === 'extreme') return true;
    return remainingMessages() > 0;
  };

  return { 
    profile, 
    loading, 
    incrementMessageCount, 
    canSendMessage, 
    remainingMessages, 
    refreshProfile: fetchProfile 
  };
}