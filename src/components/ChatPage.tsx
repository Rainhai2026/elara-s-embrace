import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useChat } from '@/hooks/useChat';
import { ChatMessageBubble } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { TypingIndicator } from '@/components/TypingIndicator';
import { PaywallBanner } from '@/components/PaywallBanner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Crown } from 'lucide-react';
import mistressAvatar from '@/assets/mistress-elara.jpg';

export function ChatPage() {
  const { user, signInAnonymously } = useAuth();
  const { profile, incrementMessageCount, canSendMessage, remainingMessages } = useProfile(user?.id);
  const { messages, isLoading, sendMessage } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto sign in anonymously
  useEffect(() => {
    if (!user) {
      signInAnonymously().catch(console.error);
    }
  }, [user, signInAnonymously]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (content: string) => {
    if (!canSendMessage() && profile?.subscription_status !== 'pro') return;
    await incrementMessageCount();
    sendMessage(content, profile?.subscription_status ?? 'free');
  };

  const isPro = profile?.subscription_status === 'pro';

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <img src={mistressAvatar} alt="Mistress Elara" className="w-10 h-10 rounded-full object-cover border border-primary/40" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">Mistress Elara</h2>
            <p className="text-xs text-muted-foreground">
              {isPro ? (
                <span className="flex items-center gap-1 text-primary">
                  <Crown className="h-3 w-3" /> Modo Extreme
                </span>
              ) : (
                'Modo Gratuito'
              )}
            </p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Welcome message */}
          {messages.length === 0 && (
            <div className="text-center py-12 space-y-3">
              <div className="text-5xl">⛓️</div>
              <h3 className="text-lg font-semibold text-foreground">Bem-vindo ao meu domínio</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                *cruza as pernas lentamente, olhando você de cima a baixo* 
                <br />Então... o que traz você aqui, pet?
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <ChatMessageBubble key={i} role={msg.role} content={msg.content} />
          ))}

          {isLoading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Paywall banner for free users */}
      {!isPro && <PaywallBanner />}

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={isLoading || (!canSendMessage() && !isPro)}
        remainingMessages={isPro ? 999 : remainingMessages()}
      />
    </div>
  );
}
