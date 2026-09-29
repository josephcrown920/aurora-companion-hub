CREATE TABLE public.colors_gateway_previews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gateway_job_id text UNIQUE NOT NULL,
  image_path text NOT NULL,
  video_path text NOT NULL,
  scene text NOT NULL DEFAULT 'colors',
  result_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.colors_gateway_previews TO authenticated;
GRANT ALL ON public.colors_gateway_previews TO service_role;
ALTER TABLE public.colors_gateway_previews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators read own Colors previews" ON public.colors_gateway_previews FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Creators create own Colors previews" ON public.colors_gateway_previews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND result_path IS NULL);
CREATE OR REPLACE FUNCTION public.touch_colors_gateway_previews() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER touch_colors_gateway_previews BEFORE UPDATE ON public.colors_gateway_previews FOR EACH ROW EXECUTE FUNCTION public.touch_colors_gateway_previews();