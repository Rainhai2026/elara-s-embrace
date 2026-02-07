import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatMessageBubble({ role, content }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-lg">
          👠
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-primary/20 border border-primary/30 text-foreground rounded-br-md'
            : 'bg-card border border-border text-foreground rounded-bl-md'
        }`}
      >
        {isUser ? (
          <p>{content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
