import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface LandingPageProps {
  onConsent: () => void;
}

export function LandingPage({ onConsent }: LandingPageProps) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Logo / Title */}
        <div className="space-y-2">
          <div className="text-6xl mb-4">⛓️</div>
          <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-tight">
            Mistress Elara
          </h1>
          <p className="text-lg text-muted-foreground italic font-light">
            Sua dominatrix virtual aguarda...
          </p>
        </div>

        {/* Warning Card */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4 text-left">
          <div className="flex items-center gap-2 text-primary font-semibold text-lg">
            <span>⚠️</span>
            <span>Aviso de Conteúdo</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Este site contém <strong className="text-foreground">conteúdo adulto e sexualmente explícito</strong> relacionado 
            a BDSM, dominação, submissão e fetiches. O acesso é <strong className="text-foreground">estritamente proibido 
            para menores de 18 anos</strong>.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Todo o conteúdo é gerado por inteligência artificial para fins de entretenimento adulto consensual. 
            Safe-words estão disponíveis a qualquer momento: <strong className="text-primary">VERMELHO</strong> (parar) 
            e <strong className="text-accent-foreground">AMARELO</strong> (reduzir intensidade).
          </p>

          <label className="flex items-start gap-3 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 h-4 w-4 accent-primary"
            />
            <span className="text-sm text-muted-foreground">
              Confirmo que tenho <strong className="text-foreground">18 anos ou mais</strong>, compreendo a natureza do conteúdo 
              e consinto em acessar este site.
            </span>
          </label>
        </div>

        <Button
          onClick={onConsent}
          disabled={!agreed}
          className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/80 disabled:opacity-30"
        >
          Entrar
        </Button>

        <p className="text-xs text-muted-foreground">
          Ao entrar, você concorda com nossos termos de uso e política de privacidade.
        </p>
      </div>
    </div>
  );
}
