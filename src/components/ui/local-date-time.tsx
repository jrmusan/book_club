"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * Formats a timestamp in the viewer's timezone. The server does not know that timezone,
 * so nothing is rendered until hydration.
 */
export function LocalDateTime({
  iso,
  options,
}: {
  iso: string;
  options: Intl.DateTimeFormatOptions;
}) {
  const text = useSyncExternalStore(
    subscribe,
    () => new Date(iso).toLocaleString(undefined, options),
    () => null
  );
  return <time dateTime={iso}>{text}</time>;
}
