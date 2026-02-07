import { useState, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  remainingMessages: number;
}

export function ChatInput({ onSend, disabled, remainingMessages }: ChatInputProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-card/50 p-3 space-y-2">
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem..."
          disabled={disabled}
          className="flex-1 bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-40"
        />
        <Button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          size="icon"
          className="rounded-xl bg-primary hover:bg-primary/80 h-10 w-10"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
        <span>Safe-words: <strong className="text-primary">VERMELHO</strong> · <strong className="text-accent-foreground">AMARELO</strong></span>
        <span>{remainingMessages} mensagens restantes hoje</span>
      </div>
    </div>
  );
}
