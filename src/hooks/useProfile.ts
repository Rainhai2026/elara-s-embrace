import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  subscription_status: string;
  daily_message_count: number;
  last_message_date: string;
}

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

      if (!data) {
        // Créer un profil par défaut si inexistant
        const today = new Date().toISOString().split('T')[0];
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([
            { 
              user_id: userId, 
              subscription_status: 'free',
              daily_message_count: 0,
              last_message_date: today
            }
          ])
          .select()
          .single();
        
        if (insertError) throw insertError;
        if (newProfile) setProfile(newProfile);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error("Error fetching/creating profile:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const incrementMessageCount = async () => {
    if (!userId || !profile) return;

    const today = new Date().toISOString().split('T')[0];
    const isNewDay = profile.last_message_date !== today;
    const newCount = isNewDay ? 1 : (profile.daily_message_count || 0) + 1;

    // Mise à jour optimiste de l'interface
    setProfile(prev => prev ? { ...prev, daily_message_count: newCount, last_message_date: today } : null);

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
      console.error("Error incrementing message count:", err);
      // En cas d'erreur, on rafraîchit pour revenir à l'état réel de la DB
      fetchProfile();
    }
  };

  const canSendMessage = () => {
    if (!profile) return true;
    if (profile.subscription_status === 'pro' || profile.subscription_status === 'extreme') return true;
    
    const today = new Date().toISOString().split('T')[0];
    if (profile.last_message_date !== today) return true;
    
    return (profile.daily_message_count || 0) < 15;
  };

  const remainingMessages = () => {
    if (!profile) return 15;
    if (profile.subscription_status === 'pro' || profile.subscription_status === 'extreme') return 999;
    
    const today = new Date().toISOString().split('T')[0];
    if (profile.last_message_date !== today) return 15;
    
    const count = profile.daily_message_count || 0;
    return Math.max(0, 15 - count);
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