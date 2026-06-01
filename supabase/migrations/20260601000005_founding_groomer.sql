-- Founding groomer incentive: 0% commission for 6 months from signup
-- Toggled via future admin dashboard; computed expiry = created_at + 6 months
alter table groomer_profiles
  add column if not exists is_founding_groomer boolean not null default false;
