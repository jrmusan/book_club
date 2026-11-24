"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * Formats a timestamp in the viewer's timezone. The server does not know that timezone,
 * so this is null until hydration.
 */
export function useLocalDateTime(iso: string, options: Intl.DateTimeFormatOptions) {
  return useSyncExternalStore(
    subscribe,
    () => new Date(iso).toLocaleString(undefined, options),
    () => null
  );
}

export function LocalDateTime({
  iso,
  options,
}: {
  iso: string;
  options: Intl.DateTimeFormatOptions;
}) {
  return <time dateTime={iso}>{useLocalDateTime(iso, options)}</time>;
}
