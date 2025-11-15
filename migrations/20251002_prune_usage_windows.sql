-- Migration: Prune old usage data when a window expires and ensure record_session resets totals

CREATE OR REPLACE FUNCTION public.record_session(p_user_id uuid, p_start timestamptz, p_end timestamptz, p_duration_seconds bigint) RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE
  win public.usage_windows%ROWTYPE;
  window_seconds bigint;
BEGIN
  -- record the session
  INSERT INTO public.usage_sessions (user_id, start, end_time, duration_seconds)
  VALUES (p_user_id, p_start, p_end, p_duration_seconds);

  -- ensure a window row exists
  INSERT INTO public.usage_windows (user_id, total_used_seconds, paused_seconds, window_start, max_usage_seconds, window_seconds)
  VALUES (p_user_id, 0, 0, NULL, 7200, 18000)
  ON CONFLICT (user_id) DO NOTHING;

  -- lock the window row for update to avoid races
  SELECT * INTO win FROM public.usage_windows WHERE user_id = p_user_id FOR UPDATE;
  window_seconds := COALESCE(win.window_seconds, 18000);

  IF win.window_start IS NULL OR (now() - win.window_start) >= (window_seconds * INTERVAL '1 second') THEN
    -- prune historical session/event rows older than a full window to keep table size bounded
    DELETE FROM public.usage_sessions WHERE user_id = p_user_id AND created_at < now() - (window_seconds * INTERVAL '1 second');
    DELETE FROM public.usage_events WHERE user_id = p_user_id AND created_at < now() - (window_seconds * INTERVAL '1 second');

    -- reset the window to start now and record only this session
    UPDATE public.usage_windows
    SET total_used_seconds = p_duration_seconds,
        window_start = now()
    WHERE user_id = p_user_id;
  ELSE
    -- within active window: accumulate and still prune very old rows outside the window
    UPDATE public.usage_windows
    SET total_used_seconds = COALESCE(total_used_seconds,0) + p_duration_seconds
    WHERE user_id = p_user_id;

    -- prune out-of-window records
    DELETE FROM public.usage_sessions WHERE user_id = p_user_id AND created_at < now() - (window_seconds * INTERVAL '1 second');
    DELETE FROM public.usage_events WHERE user_id = p_user_id AND created_at < now() - (window_seconds * INTERVAL '1 second');
  END IF;

  RETURN true;
END;
$$;
