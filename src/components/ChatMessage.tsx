import ReactMarkdown from 'react-markdown';
const MISTRESS_AVATAR = 'https://i.ibb.co/cKLtsYJ6/hotmartdomina.jpg';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
}

export function ChatMessageBubble({ role, content, imageUrl }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <img 
          src={MISTRESS_AVATAR} 
          alt="Mistress Elara" 
          className="flex-shrink-0 w-9 h-9 rounded-full object-cover border border-primary/40 self-end mb-1" 
        />
      )}
      
      <div className={`flex flex-col gap-2 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        {imageUrl && (
          <div className="overflow-hidden rounded-2xl border border-border shadow-lg">
            <img 
              src={imageUrl} 
              alt="Mistress Elara" 
              className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500 max-h-[400px]" 
            />
          </div>
        )}
        
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
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
    </div>
  );
}