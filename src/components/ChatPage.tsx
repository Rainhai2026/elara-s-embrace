import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useChat } from '@/hooks/useChat';
import { ChatMessageBubble } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { TypingIndicator } from '@/components/TypingIndicator';
import { PaywallBanner } from '@/components/PaywallBanner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Crown, Sparkles } from 'lucide-react';
const MISTRESS_AVATAR = 'https://i.ibb.co/cKLtsYJ6/hotmartdomina.jpg';

export function ChatPage() {
  const navigate = useNavigate();
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
          <img src={MISTRESS_AVATAR} alt="Mistress Elara" className="w-10 h-10 rounded-full object-cover border border-primary/40" />
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
        {!isPro && (
          <button
            onClick={() => navigate('/modo-extreme')}
            className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-full px-3 py-1.5 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">Extreme</span>
          </button>
        )}
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Welcome message */}
          {messages.length === 0 && (
            <div className="relative text-center py-12 space-y-3 overflow-hidden rounded-2xl">
              <div
                className="absolute inset-0 opacity-30 bg-cover bg-center"
                style={{ backgroundImage: "url('https://i.ibb.co/cKLtsYJ6/hotmartdomina.jpg')" }}
              />
              <div className="relative z-10">
                <div className="text-5xl">⛓️</div>
                <h3 className="text-lg font-semibold text-foreground">Bem-vindo ao meu domínio</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  *cruza as pernas lentamente, olhando você de cima a baixo* 
                  <br />Então... o que traz você aqui, pet?
                </p>
              </div>
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
