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
import { Crown, Sparkles, Trash2, RefreshCcw, Zap, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MISTRESS_AVATAR = 'https://i.ibb.co/cKLtsYJ6/hotmartdomina.jpg';

export function ChatPage() {
  const navigate = useNavigate();
  const { user, signInAnonymously } = useAuth();
  const { profile, incrementMessageCount, resetCounts, toggleExtreme, canSendMessage, remainingMessages } = useProfile(user?.id);
  const { messages, isLoading, sendMessage, clearMessages } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      signInAnonymously().catch(console.error);
    }
  }, [user, signInAnonymously]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (content: string) => {
    if (!canSendMessage() && profile?.subscription_status !== 'pro' && profile?.subscription_status !== 'extreme') return;
    
    const currentCount = (profile?.daily_message_count ?? 0) + 1;
    await incrementMessageCount();
    sendMessage(content, profile?.subscription_status ?? 'free', currentCount);
  };

  const isPro = profile?.subscription_status === 'pro' || profile?.subscription_status === 'extreme';

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-background">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur z-20">
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
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/admin-gallery')} 
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            title="Gérer la galerie"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleExtreme} 
            className={`h-8 w-8 ${isPro ? 'text-primary' : 'text-muted-foreground'} hover:text-primary`}
            title="Toggle Extreme (Dev)"
          >
            <Zap className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={resetCounts} 
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            title="Reset limits (Dev)"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
          {messages.length > 0 && (
            <Button variant="ghost" size="icon" onClick={clearMessages} className="h-8 w-8 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {!isPro && (
            <button
              onClick={() => navigate('/modo-extreme')}
              className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-full px-3 py-1.5 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">Extreme</span>
            </button>
          )}
        </div>
      </header>

      <ScrollArea className="flex-1 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="p-4 space-y-4 relative z-10">
          {messages.length === 0 && (
            <div className="text-center py-12 space-y-3">
              <div className="text-5xl mb-4">👠</div>
              <h3 className="text-lg font-semibold text-foreground">Bem-vindo ao meu domínio</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto italic">
                *cruza as pernas lentamente, olhando você de cima a baixo* 
                <br />"Então... o que traz você aqui, pet?"
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <ChatMessageBubble 
              key={i} 
              role={msg.role} 
              content={msg.content} 
              imageUrl={msg.imageUrl} 
            />
          ))}

          {isLoading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {!isPro && <PaywallBanner />}

      <ChatInput
        onSend={handleSend}
        disabled={isLoading || (!canSendMessage() && !isPro)}
        remainingMessages={isPro ? 999 : remainingMessages()}
      />
    </div>
  );
}