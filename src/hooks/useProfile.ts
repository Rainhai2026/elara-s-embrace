import { useState, useEffect, useCallback } from 'react';
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

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_status, daily_message_count, last_message_date')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];

      if (!data) {
        // Création immédiate si le profil n'existe pas
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
        // Si c'est un nouveau jour, on remet le compteur à 0 localement
        if (data.last_message_date !== today) {
          setProfile({ ...data, daily_message_count: 0, last_message_date: today });
        } else {
          setProfile(data);
        }
      }
    } catch (err) {
      console.error("Error in useProfile:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const incrementMessageCount = async () => {
    if (!userId) return;

    const today = new Date().toISOString().split('T')[0];
    
    // On calcule le nouveau compte basé sur l'état actuel ou 0
    const currentCount = profile?.daily_message_count ?? 0;
    const isNewDay = profile?.last_message_date !== today;
    const newCount = isNewDay ? 1 : currentCount + 1;

    // MISE À JOUR FORCEE DE L'INTERFACE (Optimiste)
    setProfile(prev => ({
      subscription_status: prev?.subscription_status ?? 'free',
      daily_message_count: newCount,
      last_message_date: today
    }));

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          daily_message_count: newCount,
          last_message_date: today,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;
    } catch (err) {
      console.error("Failed to sync message count:", err);
      // En cas d'échec réel, on recharge pour être sûr
      fetchProfile();
    }
  };

  const canSendMessage = () => {
    if (!profile) return true;
    if (profile.subscription_status === 'pro' || profile.subscription_status === 'extreme') return true;
    
    const today = new Date().toISOString().split('T')[0];
    if (profile.last_message_date !== today) return true;
    
    return (profile.daily_message_count || 0) < MAX_FREE_MESSAGES;
  };

  const remainingMessages = () => {
    if (profile?.subscription_status === 'pro' || profile?.subscription_status === 'extreme') return 999;
    
    const today = new Date().toISOString().split('T')[0];
    const count = (profile?.last_message_date === today) ? (profile?.daily_message_count ?? 0) : 0;
    
    return Math.max(0, MAX_FREE_MESSAGES - count);
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