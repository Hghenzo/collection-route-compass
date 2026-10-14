CREATE TYPE public.app_role AS ENUM ('admin', 'planner');
CREATE TYPE public.work_shift AS ENUM ('manha', 'tarde', 'noite');
CREATE TYPE public.volume_class AS ENUM ('baixo', 'medio', 'alto');
CREATE TYPE public.operational_priority AS ENUM ('baixa', 'normal', 'alta', 'critica');
CREATE TYPE public.collection_status AS ENUM ('nao_planejada', 'planejada', 'confirmada', 'em_andamento', 'concluida', 'com_problema');
CREATE TYPE public.support_type AS ENUM ('veiculo_extra', 'outra_rota', 'equipe_adicional', 'outro');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'planner',
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email, ''), '@', 1)), COALESCE(NEW.email, ''));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'planner');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  full_address TEXT NOT NULL DEFAULT '',
  street TEXT NOT NULL DEFAULT '',
  street_number TEXT NOT NULL DEFAULT '',
  complement TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  location_reference TEXT NOT NULL DEFAULT '',
  fixed_notes TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stores TO authenticated;
GRANT ALL ON public.stores TO service_role;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users manage stores" ON public.stores FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX stores_name_idx ON public.stores (name);
CREATE INDEX stores_region_idx ON public.stores (region);

CREATE TABLE public.plannings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_date DATE NOT NULL,
  shift public.work_shift NOT NULL,
  status public.collection_status NOT NULL DEFAULT 'nao_planejada',
  notes TEXT NOT NULL DEFAULT '',
  created_by UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (collection_date, shift)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plannings TO authenticated;
GRANT ALL ON public.plannings TO service_role;
ALTER TABLE public.plannings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users manage plannings" ON public.plannings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX plannings_date_shift_idx ON public.plannings (collection_date DESC, shift);

CREATE TABLE public.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planning_id UUID NOT NULL REFERENCES public.plannings(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  responsible TEXT NOT NULL DEFAULT '',
  vehicle TEXT NOT NULL DEFAULT '',
  capacity_packages INTEGER CHECK (capacity_packages IS NULL OR capacity_packages >= 0),
  needs_support BOOLEAN NOT NULL DEFAULT false,
  needs_extra_route BOOLEAN NOT NULL DEFAULT false,
  status public.collection_status NOT NULL DEFAULT 'planejada',
  notes TEXT NOT NULL DEFAULT '',
  archived BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (planning_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.routes TO authenticated;
GRANT ALL ON public.routes TO service_role;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users manage routes" ON public.routes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX routes_planning_idx ON public.routes (planning_id);

CREATE TABLE public.planning_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planning_id UUID NOT NULL REFERENCES public.plannings(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id),
  route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
  store_code_snapshot TEXT NOT NULL,
  store_name_snapshot TEXT NOT NULL,
  full_address_snapshot TEXT NOT NULL DEFAULT '',
  region_snapshot TEXT NOT NULL DEFAULT '',
  predicted_volume INTEGER NOT NULL DEFAULT 0 CHECK (predicted_volume >= 0),
  volume_class public.volume_class,
  needs_extra_route BOOLEAN NOT NULL DEFAULT false,
  needs_support BOOLEAN NOT NULL DEFAULT false,
  support_type public.support_type,
  priority public.operational_priority NOT NULL DEFAULT 'normal',
  status public.collection_status NOT NULL DEFAULT 'nao_planejada',
  notes TEXT NOT NULL DEFAULT '',
  duplicate_justification TEXT,
  created_by UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id),
  updated_by UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planning_stores TO authenticated;
GRANT ALL ON public.planning_stores TO service_role;
ALTER TABLE public.planning_stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users manage planning stores" ON public.planning_stores FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX planning_stores_planning_idx ON public.planning_stores (planning_id);
CREATE INDEX planning_stores_route_idx ON public.planning_stores (route_id);
CREATE INDEX planning_stores_store_idx ON public.planning_stores (store_id);

CREATE OR REPLACE FUNCTION public.validate_planning_store_duplicate()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.planning_stores ps WHERE ps.planning_id = NEW.planning_id AND ps.store_id = NEW.store_id AND ps.id <> NEW.id)
     AND NULLIF(btrim(NEW.duplicate_justification), '') IS NULL THEN
    RAISE EXCEPTION 'Uma loja duplicada exige justificativa operacional.';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER validate_planning_store_duplicate_before_write BEFORE INSERT OR UPDATE ON public.planning_stores FOR EACH ROW EXECUTE FUNCTION public.validate_planning_store_duplicate();

CREATE TABLE public.operational_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  low_volume_max INTEGER CHECK (low_volume_max IS NULL OR low_volume_max >= 0),
  medium_volume_max INTEGER CHECK (medium_volume_max IS NULL OR medium_volume_max >= 0),
  updated_by UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  singleton BOOLEAN NOT NULL DEFAULT true UNIQUE CHECK (singleton)
);
GRANT SELECT, INSERT, UPDATE ON public.operational_settings TO authenticated;
GRANT ALL ON public.operational_settings TO service_role;
ALTER TABLE public.operational_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users manage settings" ON public.operational_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  changes JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users read audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (true);
CREATE INDEX audit_logs_entity_idx ON public.audit_logs (entity_type, entity_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER plannings_updated_at BEFORE UPDATE ON public.plannings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER routes_updated_at BEFORE UPDATE ON public.routes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER planning_stores_updated_at BEFORE UPDATE ON public.planning_stores FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();