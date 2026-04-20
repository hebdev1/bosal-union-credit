
-- Drop any existing audit trigger that uses wrong column
DO $$
DECLARE
  trig RECORD;
BEGIN
  FOR trig IN
    SELECT trigger_name, event_object_table
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
      AND action_statement LIKE '%audit_trigger_func%'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', trig.trigger_name, trig.event_object_table);
  END LOOP;
END;
$$;

-- Drop the faulty function if exists
DROP FUNCTION IF EXISTS audit_trigger_func() CASCADE;
;
