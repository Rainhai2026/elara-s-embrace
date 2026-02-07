export function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-lg">
        👠
      </div>
      <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
        <div className="typing-dot w-2 h-2 rounded-full bg-primary" />
        <div className="typing-dot w-2 h-2 rounded-full bg-primary" />
        <div className="typing-dot w-2 h-2 rounded-full bg-primary" />
      </div>
    </div>
  );
}
