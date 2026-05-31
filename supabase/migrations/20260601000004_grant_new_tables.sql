-- Grant service_role access (used by supabaseAdmin, bypasses RLS)
GRANT ALL ON public.client_settings          TO service_role;
GRANT ALL ON public.client_service_prices    TO service_role;
GRANT ALL ON public.recurring_series         TO service_role;
GRANT ALL ON public.contract_terms           TO service_role;
GRANT ALL ON public.contract_acceptances     TO service_role;

-- Grant authenticated role access (used by PostgREST for logged-in users)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_settings          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_service_prices    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recurring_series         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_terms           TO authenticated;
GRANT SELECT, INSERT                 ON public.contract_acceptances     TO authenticated;

-- Grant anon read on contract_terms (needed for public groomer terms page)
GRANT SELECT ON public.contract_terms TO anon;
