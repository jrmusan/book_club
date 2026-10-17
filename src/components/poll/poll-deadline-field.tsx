"use client";

import { useMemo } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function addHours(hours: number) {
  return toLocalInputValue(new Date(Date.now() + hours * 60 * 60 * 1000));
}

const PRESETS = [
  { label: "1 day", hours: 24 },
  { label: "3 days", hours: 72 },
  { label: "1 week", hours: 168 },
] as const;

export function PollDeadlineField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const min = useMemo(() => toLocalInputValue(new Date(Date.now() + 60_000)), []);

  return (
    <div className="space-y-2">
      <Label htmlFor="closesAt">Voting deadline</Label>
      <p className="text-sm text-muted-foreground">Required — voting closes at this time.</p>
      <div className="grid grid-cols-3 gap-2">
        {PRESETS.map((preset) => (
          <Button
            key={preset.label}
            type="button"
            size="sm"
            variant="outline"
            className="w-full px-1 text-xs sm:text-sm"
            onClick={() => onChange(addHours(preset.hours))}
          >
            {preset.label}
          </Button>
        ))}
      </div>
      <Input
        id="closesAt"
        name="closesAt"
        type="datetime-local"
        required
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 max-w-full"
      />
    </div>
  );
}

export { addHours as defaultPollDeadline };
