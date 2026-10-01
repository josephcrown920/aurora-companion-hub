CREATE TABLE public.video_studio_projects (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 title text NOT NULL DEFAULT 'Untitled project',
 brief text NOT NULL DEFAULT '',
 context_notes jsonb NOT NULL DEFAULT '[]'::jsonb,
 activity jsonb NOT NULL DEFAULT '[]'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT video_studio_projects_title_length CHECK (char_length(title) <= 160),
 CONSTRAINT video_studio_projects_brief_length CHECK (char_length(brief) <= 12000),
 CONSTRAINT video_studio_projects_context_array CHECK (jsonb_typeof(context_notes) = 'array'),
 CONSTRAINT video_studio_projects_activity_array CHECK (jsonb_typeof(activity) = 'array')
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_studio_projects TO authenticated;
GRANT ALL ON public.video_studio_projects TO service_role;
ALTER TABLE public.video_studio_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators see own studio projects" ON public.video_studio_projects FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Creators start own studio projects" ON public.video_studio_projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Creators edit own studio projects" ON public.video_studio_projects FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Creators delete own studio projects" ON public.video_studio_projects FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX video_studio_projects_owner_updated ON public.video_studio_projects (user_id, updated_at DESC);
CREATE TRIGGER video_studio_projects_touch_updated BEFORE UPDATE ON public.video_studio_projects FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();