DO $migration$
DECLARE function_sql text;
BEGIN
 SELECT pg_get_functiondef(p.oid) INTO function_sql FROM pg_proc p WHERE p.pronamespace='public'::regnamespace AND p.proname='import_first_mile';
 IF function_sql IS NULL THEN RAISE EXCEPTION 'Import function missing'; END IF;
 function_sql := replace(function_sql, 'code text;', 'v_store_code text;');
 function_sql := replace(function_sql, 'code=btrim', 'v_store_code=btrim');
 function_sql := replace(function_sql, 'COALESCE(code,', 'COALESCE(v_store_code,');
 function_sql := replace(function_sql, 'IF code=ANY', 'IF v_store_code=ANY');
 function_sql := replace(function_sql, ',code;', ',v_store_code;');
 function_sql := replace(function_sql, 'array_append(seen,code)', 'array_append(seen,v_store_code)');
 function_sql := replace(function_sql, 'store_code=code', 'store_code=v_store_code');
 function_sql := replace(function_sql, 'VALUES(code,', 'VALUES(v_store_code,');
 function_sql := replace(function_sql, 'sid,rid,code,', 'sid,rid,v_store_code,');
 EXECUTE function_sql;
END
$migration$;