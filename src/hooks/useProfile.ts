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

  const fetchProfile = async () => {
    if (!userId) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('subscription_status, daily_message_count, last_message_date')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (!data && !error) {
      // Créer un profil par défaut si inexistant
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert([
          { 
            user_id: userId, 
            subscription_status: 'free',
            daily_message_count: 0,
            last_message_date: new Date().toISOString().split('T')[0]
          }
        ])
        .select()
        .single();
      
      if (newProfile) setProfile(newProfile);
    } else {
      setProfile(data);
    }
    setLoading(false);
  };

  useEffect(() => {
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
    if (!profile) return true; // Autoriser par défaut pendant le chargement
    if (profile.subscription_status === 'pro') return true;
    const today = new Date().toISOString().split('T')[0];
    if (profile.last_message_date !== today) return true;
    return profile.daily_message_count < 15;
  };

  const remainingMessages = () => {
    if (!profile) return 15;
    if (profile.subscription_status === 'pro') return 999;
    const today = new Date().toISOString().split('T')[0];
    if (profile.last_message_date !== today) return 15;
    return Math.max(0, 15 - profile.daily_message_count);
  };

  return { profile, loading, incrementMessageCount, canSendMessage, remainingMessages, refreshProfile: fetchProfile };
}