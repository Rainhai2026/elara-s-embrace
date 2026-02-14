import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useChat } from '@/hooks/useChat';
import { ChatMessageBubble } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { TypingIndicator } from '@/components/TypingIndicator';
import { PaywallBanner } from '@/components/PaywallBanner';
import { UpgradeVideo } from '@/components/UpgradeVideo';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Crown, Sparkles, Trash2, RefreshCcw, Zap, Image as ImageIcon, Timer, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const MISTRESS_AVATAR = 'https://i.ibb.co/cKLtsYJ6/hotmartdomina.jpg';
// Substitua este link pelo seu vídeo real
const UPGRADE_VIDEO_URL = 'https://www.w3schools.com/html/mov_bbb.mp4'; 

export function ChatPage() {
  const navigate = useNavigate();
  const { user, signInAnonymously } = useAuth();
  const { profile, incrementMessageCount, resetCounts, toggleExtreme, canSendMessage, remainingMessages } = useProfile(user?.id);
  const { messages, isLoading, sendMessage, clearMessages } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  
  const [isSilentMode, setIsSilentMode] = useState(false);
  const [silentSeconds, setSilentSeconds] = useState(0);

  useEffect(() => {
    if (!user) {
      signInAnonymously().catch(console.error);
    }
  }, [user, signInAnonymously]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
      const lastMsg = messages[messages.length - 1].content
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      
      const silenceKeywords = ['silencio', 'calado', 'cale a boca', 'nao diga nada', 'espere minha ordem', 'fique quieto'];
      const shouldBeSilent = silenceKeywords.some(keyword => lastMsg.includes(keyword));
      
      if (shouldBeSilent && !isSilentMode) {
        setIsSilentMode(true);
        setSilentSeconds(30);
        toast.error("ORDEM DE SILÊNCIO: Não ouse digitar nada.");
      }
    }
  }, [messages, isSilentMode]);

  useEffect(() => {
    let interval: number;
    if (isSilentMode && silentSeconds > 0) {
      interval = window.setInterval(() => {
        setSilentSeconds(prev => prev - 1);
      }, 1000);
    } else if (isSilentMode && silentSeconds === 0) {
      setIsSilentMode(false);
      handleSend("..."); 
    }
    return () => clearInterval(interval);
  }, [isSilentMode, silentSeconds]);

  const handleSend = async (content: string) => {
    if (isSilentMode && content !== "...") return;
    if (!canSendMessage() && profile?.subscription_status !== 'pro' && profile?.subscription_status !== 'extreme') return;
    
    const currentCount = (profile?.daily_message_count ?? 0) + 1;
    await incrementMessageCount();
    
    const finalContent = content === "..." 
      ? "O tempo de silêncio acabou. O pet obedeceu. Continue." 
      : content;
    
    sendMessage(finalContent, profile?.subscription_status ?? 'free', currentCount);
  };

  const isPro = profile?.subscription_status === 'pro' || profile?.subscription_status === 'extreme';
  const isLimitReached = !canSendMessage() && !isPro;

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-background">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur z-20">
        <div className="flex items-center gap-3">
          <img src={MISTRESS_AVATAR} alt="Mistress Elara" className="w-10 h-10 rounded-full object-cover border border-primary/40" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">Mistress Elara</h2>
            <p className="text-xs text-muted-foreground">
              {isSilentMode ? (
                <span className="flex items-center gap-1 text-amber-500 animate-pulse">
                  <Timer className="h-3 w-3" /> Silêncio: {silentSeconds}s
                </span>
              ) : isPro ? (
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
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin-gallery')} className="h-8 w-8 text-muted-foreground hover:text-primary">
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleExtreme} className={`h-8 w-8 ${isPro ? 'text-primary' : 'text-muted-foreground'} hover:text-primary`}>
            <Zap className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={resetCounts} className="h-8 w-8 text-muted-foreground hover:text-primary">
            <RefreshCcw className="h-4 w-4" />
          </Button>
          {messages.length > 0 && (
            <Button variant="ghost" size="icon" onClick={clearMessages} className="h-8 w-8 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </header>

      <ScrollArea className="flex-1 relative">
        <div className="p-4 space-y-4 relative z-10">
          {messages.length === 0 && (
            <div className="text-center py-12 space-y-3">
              <div className="text-5xl mb-4">👠</div>
              <h3 className="text-lg font-semibold text-foreground">Bem-vindo ao meu domínio</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto italic">
                "Então... o que traz você aqui, pet?"
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <ChatMessageBubble key={i} role={msg.role} content={msg.content} imageUrl={msg.imageUrl} />
          ))}

          {isLimitReached && (
            <div className="py-4">
              <UpgradeVideo videoUrl={UPGRADE_VIDEO_URL} />
            </div>
          )}

          {isLoading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {!isPro && !isLimitReached && <PaywallBanner />}

      <ChatInput
        onSend={handleSend}
        disabled={isLoading || isSilentMode || isLimitReached}
        remainingMessages={isPro ? 999 : remainingMessages()}
      />
    </div>
  );
}