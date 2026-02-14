import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus, ArrowLeft, Image as ImageIcon, AlertCircle, ListPlus, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export default function AdminGallery() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, signInAnonymously } = useAuth();
  const [newUrl, setNewUrl] = useState('');
  const [bulkUrls, setBulkUrls] = useState('');
  const [showBulk, setShowBulk] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        try {
          await supabase.auth.signInAnonymously();
        } catch (err) {
          console.error("Auth error:", err);
        }
      }
    };
    checkAuth();
  }, []);

  const { data: images, isLoading } = useQuery({
    queryKey: ['gallery-images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gallery_images')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (urls: string[]) => {
      const inserts = urls.map(url => ({ url: url.trim() }));
      const { error } = await supabase.from('gallery_images').insert(inserts);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-images'] });
      setNewUrl('');
      setBulkUrls('');
      setShowBulk(false);
      toast.success('Fotos adicionadas com sucesso');
    },
    onError: (error: any) => {
      console.error("Erro Supabase:", error);
      toast.error(`Erro: ${error.message || 'Verifique os links e tente novamente'}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('gallery_images').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-images'] });
      toast.success('Foto removida');
    },
    onError: (error: any) => {
      toast.error(`Erro ao remover: ${error.message}`);
    }
  });

  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;
    addMutation.mutate([newUrl.trim()]);
  };

  const handleAddBulk = () => {
    const urls = bulkUrls.split('\n').filter(url => url.trim().length > 0);
    if (urls.length === 0) return;
    addMutation.mutate(urls);
  };

  return (
    <div className="min-h-screen bg-background p-6 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ImageIcon className="text-primary" /> Galeria Admin
        </h1>
      </header>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 flex gap-3 items-start">
        <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-200/80">
          <p className="font-bold text-amber-500 mb-1">Atenção aos Links!</p>
          Use apenas <strong>Links Diretos</strong> (ex: https://i.ibb.co/abc/foto.jpg).
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Adicionar Fotos</h2>
          <Button variant="outline" size="sm" onClick={() => setShowBulk(!showBulk)}>
            {showBulk ? 'Usar link único' : 'Adicionar em massa'}
          </Button>
        </div>

        {!showBulk ? (
          <form onSubmit={handleAddSingle} className="flex gap-2 bg-card p-4 rounded-xl border border-border">
            <Input
              placeholder="Cole o link DIRETO da imagem..."
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={addMutation.isPending}>
              {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />} 
              Adicionar
            </Button>
          </form>
        ) : (
          <div className="bg-card p-4 rounded-xl border border-border space-y-3">
            <Textarea
              placeholder="Cole vários links diretos (um por linha)..."
              value={bulkUrls}
              onChange={(e) => setBulkUrls(e.target.value)}
              className="min-h-[150px] font-mono text-xs"
            />
            <Button onClick={handleAddBulk} className="w-full" disabled={addMutation.isPending}>
              {addMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ListPlus className="h-4 w-4 mr-2" />
              )}
              Adicionar {bulkUrls.split('\n').filter(u => u.trim()).length} fotos
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Carregando galeria...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images?.map((img) => (
            <div key={img.id} className="group relative aspect-square rounded-xl overflow-hidden border border-border bg-muted">
              <img src={img.url} alt="Gallery" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => deleteMutation.mutate(img.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}