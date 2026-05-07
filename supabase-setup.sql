-- =========================================================
-- Pandex Store — Schema inicial (rode no SQL Editor do Supabase)
-- =========================================================

-- Tabela única chave/valor que armazena todos os dados do app
-- (produtos, categorias, coleções, financeiro, pedidos, analytics).
CREATE TABLE IF NOT EXISTS public.app_kv (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_kv ENABLE ROW LEVEL SECURITY;

-- Leitura pública (a loja precisa ler produtos e categorias).
DROP POLICY IF EXISTS "app_kv read public" ON public.app_kv;
CREATE POLICY "app_kv read public"
  ON public.app_kv FOR SELECT
  USING (true);

-- Escrita liberada (o controle de acesso é feito no app via senha do admin).
-- Se quiser bloquear escrita externa, depois substitua por auth.role() = 'authenticated'.
DROP POLICY IF EXISTS "app_kv write public" ON public.app_kv;
CREATE POLICY "app_kv write public"
  ON public.app_kv FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index opcional para ordenação por data
CREATE INDEX IF NOT EXISTS app_kv_updated_at_idx ON public.app_kv (updated_at DESC);
