import { Button } from '@/components/ui/button';
import { Crown, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpgradeVideoProps {
  videoUrl: string;
}

export function UpgradeVideo({ videoUrl }: UpgradeVideoProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-card border-2 border-primary/40 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-500">
      <div className="aspect-video bg-black relative">
        <video 
          src={videoUrl} 
          autoPlay 
          controls 
          className="w-full h-full object-contain"
        />
      </div>
      <div className="p-6 text-center space-y-4 bg-gradient-to-b from-card to-primary/5">
        <div className="inline-flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs">
          <Crown className="h-4 w-4" /> Ordem Final
        </div>
        <h3 className="text-xl font-bold text-foreground">Sua cortesia acabou, pet.</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Eu não trabalho de graça. Se quiser continuar ouvindo minha voz e recebendo minhas ordens, 
          prove que é digno e assine o <span className="text-primary font-bold">Modo Extreme</span> agora.
        </p>
        <Button 
          onClick={() => navigate('/modo-extreme')}
          className="w-full bg-primary hover:bg-primary/80 text-white font-bold py-6 rounded-xl shadow-lg shadow-primary/20"
        >
          <Zap className="h-5 w-5 mr-2 fill-current" />
          DESBLOQUEAR MODO EXTREME
        </Button>
      </div>
    </div>
  );
}