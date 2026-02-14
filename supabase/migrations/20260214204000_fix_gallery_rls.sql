-- Esta migração corrige a política de RLS para permitir inserções na tabela gallery_images
-- O erro anterior ocorria porque a política 'Admin full access' não possuía a cláusula 'WITH CHECK'

ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access" ON gallery_images;
CREATE POLICY "Admin full access" ON gallery_images 
FOR ALL 
TO public
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Public read access" ON gallery_images;
CREATE POLICY "Public read access" ON gallery_images 
FOR SELECT 
TO public
USING (true);