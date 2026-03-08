-- Automatically enable RLS on every new table in the public schema.
-- This prevents accidentally shipping a table without RLS.

CREATE OR REPLACE FUNCTION enable_rls_on_new_table()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands()
    WHERE command_tag = 'CREATE TABLE'
      AND schema_name = 'public'
  LOOP
    EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', obj.object_identity);
  END LOOP;
END;
$$;

CREATE EVENT TRIGGER auto_enable_rls
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE')
  EXECUTE FUNCTION enable_rls_on_new_table();
