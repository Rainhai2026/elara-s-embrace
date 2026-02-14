import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string, subscriptionStatus: string) => {
    const userMessage: ChatMessage = { role: 'user', content };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Utilisation de l'URL complète pour garantir la connexion
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          messages: updatedMessages,
          subscription_status: subscriptionStatus,
        },
      });

      if (error) {
        console.error('Supabase Function Error:', error);
        throw error;
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.content,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error details:', err);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: '*suspira irritada* Algo deu errado na minha conexão, pet. Verifique se as chaves de API estão configuradas no Supabase.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearMessages = () => setMessages([]);

  return { messages, isLoading, sendMessage, clearMessages };
}