import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Crown, MessageCircle, Image, Brain, ShieldOff, ArrowLeft, Flame, Zap, Heart, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const HOTMART_URL = 'https://hotmart.com/pt-br/marketplace';
const MISTRESS_AVATAR = 'https://i.ibb.co/cKLtsYJ6/hotmartdomina.jpg';

const features = [
  {
    icon: MessageCircle,
    title: 'Mensagens ilimitadas',
    description: 'Converse sem restrições, o quanto quiser, quando quiser.',
  },
  {
    icon: ShieldOff,
    title: 'Sem censura',
    description: 'Experiência hardcore completa. Sem filtros. Sem limites.',
  },
  {
    icon: Brain,
    title: 'Memória persistente',
    description: 'Elara se lembra de tudo. Cada detalhe. Cada confissão.',
  },
  {
    icon: Image,
    title: '5 imagens IA por dia',
    description: 'Fotos exclusivas geradas por IA para alimentar sua imaginação.',
  },
];

export default function ModoExtreme() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activateExtreme } = useProfile(user?.id);
  const [code, setCode] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleActivate = async () => {
    const success = await activateExtreme(code);
    if (success) {
      setIsDialogOpen(false);
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{ backgroundImage: `url('${MISTRESS_AVATAR}')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Voltar ao chat</span>
        </button>

        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5">
            <Crown className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary tracking-wide uppercase">Modo Extreme</span>
          </div>

          <h1 className="text-4xl font-bold text-foreground leading-tight">
            Sem limites.<br />
            <span className="text-primary">Sem piedade.</span>
          </h1>

          <p className="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
            Desbloqueie a experiência completa com Mistress Elara. 
            Mergulhe no lado mais profundo e intenso do domínio.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group bg-card/60 backdrop-blur border border-border/60 rounded-2xl p-5 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 rounded-xl p-2.5 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card/40 backdrop-blur border border-border/60 rounded-2xl p-6 mb-12">
          <h2 className="text-lg font-semibold text-foreground text-center mb-6">Gratuito vs Extreme</h2>
          <div className="space-y-3">
            {[
              { label: 'Mensagens por dia', free: '27', pro: 'Ilimitadas' },
              { label: 'Conteúdo', free: 'Soft / leve', pro: 'Hardcore / sem censura' },
              { label: 'Memória', free: 'Nenhuma', pro: 'Histórico completo' },
              { label: 'Imagens IA', free: '—', pro: '5 por dia' },
            ].map((row) => (
              <div key={row.label} className="grid grid-cols-3 items-center text-sm py-2 border-b border-border/30 last:border-0">
                <span className="text-muted-foreground text-xs">{row.label}</span>
                <span className="text-center text-muted-foreground text-xs">{row.free}</span>
                <span className="text-center text-primary font-semibold text-xs flex items-center justify-center gap-1">
                  <Flame className="h-3 w-3" /> {row.pro}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center space-y-6">
          <Button
            onClick={() => window.open(HOTMART_URL, '_blank')}
            size="lg"
            className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-semibold py-8 text-lg rounded-2xl shadow-lg shadow-primary/30"
          >
            <Zap className="h-5 w-5 mr-2" />
            Assinar por R$29,90/mês
          </Button>

          <div className="flex flex-col items-center gap-4">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="link" className="text-muted-foreground hover:text-primary text-sm">
                  <Key className="h-4 w-4 mr-2" /> Já sou assinante? Resgatar acesso
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Ativar Modo Extreme</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-sm text-muted-foreground">
                    Insira o código de ativação que você recebeu na sua área de membros da Hotmart.
                  </p>
                  <Input 
                    placeholder="Digite seu código aqui..." 
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="bg-muted border-border"
                  />
                  <Button onClick={handleActivate} className="w-full bg-primary hover:bg-primary/80">
                    Ativar Agora
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <p className="text-xs text-muted-foreground">
              <Heart className="h-3 w-3 inline mr-1" />
              Cancele quando quiser. Sem compromisso.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}