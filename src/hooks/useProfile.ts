import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  subscription_status: string;
  daily_message_count: number;
  last_message_date: string;
}

const MAX_FREE_MESSAGES = 15;
const LOCAL_STORAGE_KEY = 'elara_guest_profile';

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Charger le profil (soit depuis Supabase, soit depuis le stockage local)
  const fetchProfile = useCallback(async () => {
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    let currentProfile: Profile = localData 
      ? JSON.parse(localData) 
      : { subscription_status: 'free', daily_message_count: 0, last_message_date: today };

    // Si on a un utilisateur connecté, on essaie de synchroniser avec Supabase
    if (userId) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('subscription_status, daily_message_count, last_message_date')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (!error && data) {
          currentProfile = data;
        }
      } catch (err) {
        console.warn("[useProfile] Supabase sync failed, using local data");
      }
    }

    // Reset si nouveau jour
    if (currentProfile.last_message_date !== today) {
      currentProfile.daily_message_count = 0;
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

    // 1. Mise à jour de l'état (immédiat)
    setProfile(updatedProfile);

    // 2. Sauvegarde locale (toujours)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedProfile));

    // 3. Tentative de sauvegarde Supabase (si connecté)
    if (userId) {
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
        console.error("[useProfile] DB update failed");
      }
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