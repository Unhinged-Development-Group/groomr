-- Add xs and xl to the dog_size enum (cannot remove 'giant' without recreating the type).
ALTER TYPE dog_size ADD VALUE IF NOT EXISTS 'xs' BEFORE 'small';
ALTER TYPE dog_size ADD VALUE IF NOT EXISTS 'xl' AFTER 'large';
