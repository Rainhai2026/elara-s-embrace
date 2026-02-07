import { Button } from '@/components/ui/button';
import { Crown } from 'lucide-react';

const HOTMART_URL = 'https://hotmart.com/pt-br/marketplace'; // Replace with actual Hotmart link

export function PaywallBanner() {
  return (
    <div className="bg-gradient-to-r from-secondary/30 to-primary/20 border border-secondary/40 rounded-xl p-4 mx-3 my-2">
      <div className="flex items-center gap-3">
        <Crown className="h-8 w-8 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Desbloqueie o Modo Extreme</p>
          <p className="text-xs text-muted-foreground">Sem limites. Sem censura. Sem piedade.</p>
        </div>
        <Button
          onClick={() => window.open(HOTMART_URL, '_blank')}
          size="sm"
          className="bg-primary hover:bg-primary/80 text-xs whitespace-nowrap"
        >
          R$29,90/mês
        </Button>
      </div>
    </div>
  );
}
