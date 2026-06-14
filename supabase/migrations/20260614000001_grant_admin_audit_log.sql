-- Grant table-level privileges on admin_audit_log.
-- RLS was enabled but no GRANTs were issued, blocking all PostgREST access.
GRANT SELECT, INSERT ON public.admin_audit_log TO authenticated;
GRANT SELECT, INSERT ON public.admin_audit_log TO service_role;
