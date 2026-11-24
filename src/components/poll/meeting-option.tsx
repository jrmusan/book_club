"use client";

import { CalendarDays, MapPin } from "lucide-react";
import { LocalDateTime, useLocalDateTime } from "@/components/ui/local-date-time";
import { MEETING_WHEN_FORMAT } from "@/lib/dates";

export function MeetingDateTile({ iso }: { iso: string }) {
  const month = useLocalDateTime(iso, { month: "short" });
  const day = useLocalDateTime(iso, { day: "numeric" });
  const weekday = useLocalDateTime(iso, { weekday: "short" });

  return (
    <div
      aria-hidden
      className="flex w-14 shrink-0 flex-col items-center overflow-hidden rounded-xl border border-border bg-card text-center shadow-sm sm:w-16"
    >
      <span className="w-full bg-primary py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-primary-foreground">
        {month ?? "\u00a0"}
      </span>
      <span className="pt-1 text-2xl font-bold leading-none tabular-nums">{day ?? "\u00a0"}</span>
      <span className="pb-1 pt-0.5 text-[0.7rem] font-medium uppercase text-muted-foreground">
        {weekday ?? "\u00a0"}
      </span>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

export function MeetingWhenWhere({ startsAt, place }: { startsAt: string; place: string | null }) {
  return (
    <div className="space-y-2">
      <div>
        <FieldLabel>When</FieldLabel>
        <p className="flex min-h-6 items-start gap-1.5 font-semibold leading-snug text-base sm:text-[1.05rem]">
          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          <LocalDateTime iso={startsAt} options={MEETING_WHEN_FORMAT} />
        </p>
      </div>
      {place && (
        <div>
          <FieldLabel>Where</FieldLabel>
          <p className="flex items-start gap-1.5 text-sm leading-snug sm:text-base">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            {place}
          </p>
        </div>
      )}
    </div>
  );
}
