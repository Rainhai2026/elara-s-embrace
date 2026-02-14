import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function AdminGallery() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newUrl, setNewUrl] = useState('');

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
    mutationFn: async (url: string) => {
      const { error } = await supabase.from('gallery_images').insert([{ url }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-images'] });
      setNewUrl('');
      toast.success('Photo ajoutée à la galerie');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('gallery_images').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-images'] });
      toast.success('Photo supprimée');
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;
    addMutation.mutate(newUrl.trim());
  };

  return (
    <div className="min-h-screen bg-background p-6 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ImageIcon className="text-primary" /> Galerie Admin
        </h1>
      </header>

      <form onSubmit={handleAdd} className="flex gap-2 mb-8 bg-card p-4 rounded-xl border border-border">
        <Input
          placeholder="Collez l'URL d'une image ici..."
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={addMutation.isPending}>
          <Plus className="h-4 w-4 mr-2" /> Ajouter
        </Button>
      </form>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
          {images?.length === 0 && (
            <div className="col-span-full text-center py-12 border-2 border-dashed border-border rounded-xl text-muted-foreground">
              Aucune image dans la galerie.
            </div>
          )}
        </div>
      )}
    </div>
  );
}