-- Run on server as postgres superuser:
-- sudo -u postgres psql -f scripts/db-setup.sql

CREATE USER wepac WITH PASSWORD 'CHANGEME';
CREATE DATABASE wepac_production OWNER wepac;
GRANT ALL PRIVILEGES ON DATABASE wepac_production TO wepac;
