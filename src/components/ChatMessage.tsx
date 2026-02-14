import ReactMarkdown from 'react-markdown';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

const MISTRESS_AVATAR = 'https://i.ibb.co/cKLtsYJ6/hotmartdomina.jpg';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
}

export function ChatMessageBubble({ role, content, imageUrl }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end mb-2`}>
      {!isUser && (
        <img 
          src={MISTRESS_AVATAR} 
          alt="Mistress Elara" 
          className="flex-shrink-0 w-8 h-8 rounded-full object-cover border border-primary/30 mb-1" 
        />
      )}
      
      <div className={`flex flex-col gap-1 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        {imageUrl && (
          <Dialog>
            <DialogTrigger asChild>
              <div className="overflow-hidden rounded-2xl border border-border/50 shadow-sm mb-1 max-w-[280px] cursor-zoom-in hover:opacity-90 transition-opacity">
                <img 
                  src={imageUrl} 
                  alt="Mistress Elara" 
                  className="w-full h-auto object-cover" 
                />
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-none bg-transparent shadow-none flex items-center justify-center">
              <img 
                src={imageUrl} 
                alt="Mistress Elara Ampliada" 
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              />
            </DialogContent>
          </Dialog>
        )}
        
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-none'
              : 'bg-card border border-border text-foreground rounded-bl-none'
          }`}
        >
          {isUser ? (
            <p>{content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none break-words">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}