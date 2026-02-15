import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Profile {
  subscription_status: string;
  daily_message_count: number;
  daily_image_count: number;
  last_message_date: string;
  subscription_end_date?: string | null;
}

const MAX_FREE_MESSAGES = 27;
const LOCAL_STORAGE_KEY = 'elara_guest_profile';
const SECRET_ACTIVATION_CODE = 'EXTREME2024'; // Mude isso mensalmente se quiser mais segurança

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
          .select('subscription_status, daily_message_count, daily_image_count, last_message_date, subscription_end_date')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (!error && data) {
          currentProfile = data;
        }
      } catch (err) {
        console.warn("[useProfile] Supabase sync failed");
      }
    }

    // Verificar se a assinatura expirou
    if (currentProfile.subscription_status === 'extreme' && currentProfile.subscription_end_date) {
      const expiryDate = new Date(currentProfile.subscription_end_date);
      if (expiryDate < new Date()) {
        currentProfile.subscription_status = 'free';
        currentProfile.subscription_end_date = null;
        // Atualiza no banco para persistir a expiração
        if (userId) {
          await supabase.from('profiles').update({ 
            subscription_status: 'free', 
            subscription_end_date: null 
          }).eq('user_id', userId);
        }
        toast.error("Sua assinatura expirou. Renove na Hotmart para continuar no Modo Extreme.");
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

  const activateExtreme = async (code: string) => {
    if (!profile) return false;
    
    // Se o usuário já tem uma assinatura ativa, não deixa ativar de novo com o mesmo código
    if (profile.subscription_status === 'extreme') {
      toast.info("Você já possui o Modo Extreme ativo, pet.");
      return false;
    }

    if (code.trim().toUpperCase() === SECRET_ACTIVATION_CODE) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      const expiryString = expiryDate.toISOString();

      const updatedProfile = { 
        ...profile, 
        subscription_status: 'extreme',
        subscription_end_date: expiryString 
      };

      setProfile(updatedProfile);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedProfile));
      
      if (userId) {
        await supabase.from('profiles').update({ 
          subscription_status: 'extreme',
          subscription_end_date: expiryString 
        }).eq('user_id', userId);
      }
      
      toast.success("MODO EXTREME ATIVADO POR 30 DIAS! Aproveite, pet.");
      return true;
    } else {
      toast.error("Código inválido. Não tente me enganar.");
      return false;
    }
  };

  const toggleExtreme = async () => {
    if (!profile) return;
    const newStatus = profile.subscription_status === 'extreme' ? 'free' : 'extreme';
    const updatedProfile = { ...profile, subscription_status: newStatus };
    setProfile(updatedProfile);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedProfile));
    if (userId) {
      await supabase.from('profiles').update({ subscription_status: newStatus }).eq('user_id', userId);
    }
  };

  const resetCounts = async () => {
    const resetProfile = { 
      subscription_status: 'free', 
      daily_message_count: 0, 
      daily_image_count: 0, 
      last_message_date: today,
      subscription_end_date: null
    };
    setProfile(resetProfile);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(resetProfile));
    if (userId) {
      await supabase.from('profiles').update({ 
        daily_message_count: 0, 
        daily_image_count: 0, 
        subscription_status: 'free',
        subscription_end_date: null 
      }).eq('user_id', userId);
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
    toggleExtreme,
    activateExtreme,
    remainingMessages, 
    canSendMessage: () => (profile?.subscription_status === 'pro' || profile?.subscription_status === 'extreme') || remainingMessages() > 0,
  };
}