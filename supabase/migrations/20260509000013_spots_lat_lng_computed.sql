-- spots.coordinates (GEOGRAPHY POINT) から PostgREST 経由で lat/lng を取り出すための
-- computed column。`.select('id, name, latitude:spots_latitude, longitude:spots_longitude')`
-- のように呼び出せるようにする。ST_X / ST_Y は引数の型が geometry なのでキャストする。
CREATE OR REPLACE FUNCTION public.spots_latitude(s public.spots)
RETURNS double precision
LANGUAGE sql
STABLE
PARALLEL SAFE
AS $$
  SELECT ST_Y(s.coordinates::geometry)::double precision
$$;

CREATE OR REPLACE FUNCTION public.spots_longitude(s public.spots)
RETURNS double precision
LANGUAGE sql
STABLE
PARALLEL SAFE
AS $$
  SELECT ST_X(s.coordinates::geometry)::double precision
$$;
