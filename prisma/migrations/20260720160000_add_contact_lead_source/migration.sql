-- Centralized lead inbox: /contacto submissions now persist as leads.
ALTER TYPE "LeadSource" ADD VALUE IF NOT EXISTS 'contact';
