export function TypingIndicator() {
  return (
    <div className="flex gap-2 items-end mb-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm">
        👠
      </div>
      <div className="bg-card border border-border rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-1.5 shadow-sm">
        <div className="typing-dot w-1.5 h-1.5 rounded-full bg-primary/60" />
        <div className="typing-dot w-1.5 h-1.5 rounded-full bg-primary/60" />
        <div className="typing-dot w-1.5 h-1.5 rounded-full bg-primary/60" />
      </div>
    </div>
  );
}