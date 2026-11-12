CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','planner'))
$$;

DROP POLICY IF EXISTS "Authenticated users manage settings" ON public.operational_settings;
CREATE POLICY "Staff manage settings" ON public.operational_settings FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users manage planning stores" ON public.planning_stores;
CREATE POLICY "Staff manage planning stores" ON public.planning_stores FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users manage stores" ON public.stores;
CREATE POLICY "Staff manage stores" ON public.stores FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users manage routes" ON public.routes;
CREATE POLICY "Staff manage routes" ON public.routes FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users manage plannings" ON public.plannings;
CREATE POLICY "Staff manage plannings" ON public.plannings FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users read audit logs" ON public.audit_logs;
CREATE POLICY "Staff read audit logs" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

-- Novos cadastros não recebem acesso automático; um administrador concede o papel.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email, ''), '@', 1)), COALESCE(NEW.email, ''));
  RETURN NEW;
END;
$$;