import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface TimePickerProps {
  value?: string;
  onChange?: (time: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

type HourRange = "0-11" | "12-23";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

const padTime = (value: number) => value.toString().padStart(2, "0");

const to12Hour = (hour24: number) => {
  const normalized = hour24 % 12;
  return normalized === 0 ? 12 : normalized;
};

const to24Hour = (hour12: number, range: HourRange) => {
  if (range === "12-23") {
    return hour12 === 12 ? 12 : hour12 + 12;
  }
  return hour12 === 12 ? 0 : hour12;
};

const getClockPosition = (index: number, total: number, radius = 42) => {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  return {
    left: `${50 + Math.cos(angle) * radius}%`,
    top: `${50 + Math.sin(angle) * radius}%`,
  };
};

const ClockFace = () => (
  <svg
    className="absolute inset-0 h-full w-full text-muted-foreground/40"
    viewBox="0 0 100 100"
    aria-hidden="true"
  >
    <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.8" />
    {Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const x1 = 50 + Math.cos(angle) * 40;
      const y1 = 50 + Math.sin(angle) * 40;
      const x2 = 50 + Math.cos(angle) * 46;
      const y2 = 50 + Math.sin(angle) * 46;
      return (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="currentColor"
          strokeWidth="1.2"
        />
      );
    })}
    <circle cx="50" cy="50" r="1.6" fill="currentColor" />
  </svg>
);

export function TimePicker({
  value,
  onChange,
  placeholder = "Selecione um horario",
  disabled = false,
  className
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"hour" | "minute">("hour");
  const [hourRange, setHourRange] = React.useState<HourRange>("0-11");

  const [hourValue, minuteValue] = value?.split(":") ?? [];
  const parsedHour = hourValue ? Number.parseInt(hourValue, 10) : null;
  const parsedMinute = minuteValue ? Number.parseInt(minuteValue, 10) : null;

  const selectedHour12 = parsedHour !== null && !Number.isNaN(parsedHour) ? to12Hour(parsedHour) : null;
  const selectedMinute = parsedMinute !== null && !Number.isNaN(parsedMinute) ? parsedMinute : null;
  const safeMinute = parsedMinute !== null && !Number.isNaN(parsedMinute) ? parsedMinute : 0;

  const displayTime = parsedHour !== null && !Number.isNaN(parsedHour)
    ? `${padTime(parsedHour)}:${padTime(safeMinute)}`
    : "--:--";

  React.useEffect(() => {
    if (parsedHour !== null && !Number.isNaN(parsedHour)) {
      setHourRange(parsedHour >= 12 ? "12-23" : "0-11");
    }
  }, [parsedHour]);

  React.useEffect(() => {
    if (!open) {
      setMode("hour");
    }
  }, [open]);

  const handleRangeChange = (nextRange: HourRange) => {
    setHourRange(nextRange);
    if (parsedHour !== null && !Number.isNaN(parsedHour)) {
      const hour12 = to12Hour(parsedHour);
      const nextHour = to24Hour(hour12, nextRange);
      const minute = safeMinute;
      onChange?.(`${padTime(nextHour)}:${padTime(minute)}`);
    }
  };

  const handleHourSelect = (hour12: number) => {
    const nextHour = to24Hour(hour12, hourRange);
    const minute = selectedMinute ?? 0;
    onChange?.(`${padTime(nextHour)}:${padTime(minute)}`);
    setMode("minute");
  };

  const handleMinuteSelect = (minute: number) => {
    const nextHour = parsedHour !== null && !Number.isNaN(parsedHour)
      ? parsedHour
      : to24Hour(selectedHour12 ?? 12, hourRange);
    onChange?.(`${padTime(nextHour)}:${padTime(minute)}`);
    setOpen(false);
  };

  const dialItems = mode === "hour" ? HOURS : MINUTES;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value || <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-4" align="start">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Horario</div>
            <div className="text-lg font-semibold tabular-nums">{displayTime}</div>
          </div>
          <div className="flex items-center rounded-full border border-border/60 bg-background/70 p-1 shadow-sm">
            <Button
              type="button"
              size="sm"
              variant={mode === "hour" ? "default" : "ghost"}
              onClick={() => setMode("hour")}
              className="rounded-full px-3 shadow-none hover:shadow-none hover:translate-y-0"
            >
              Horas
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "minute" ? "default" : "ghost"}
              onClick={() => setMode("minute")}
              className="rounded-full px-3 shadow-none hover:shadow-none hover:translate-y-0"
            >
              Minutos
            </Button>
          </div>
        </div>

        <div className="mt-4 flex justify-center">
          <div className="relative h-64 w-64 rounded-full bg-gradient-to-br from-background to-muted/30 shadow-inner ring-1 ring-border/60">
            <ClockFace />
            {dialItems.map((item, index) => {
              const label = mode === "hour" ? String(item) : padTime(item);
              const isSelected = mode === "hour"
                ? selectedHour12 === item
                : selectedMinute === item;
              const position = getClockPosition(index, dialItems.length);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => (mode === "hour" ? handleHourSelect(item) : handleMinuteSelect(item))}
                  className={cn(
                    "absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-sm font-semibold transition-all",
                    "bg-background/90 text-foreground shadow-sm ring-1 ring-border/40 hover:bg-primary/10 hover:text-primary",
                    isSelected && "bg-primary text-primary-foreground ring-primary/60 shadow-md"
                  )}
                  style={position}
                >
                  {label}
                </button>
              );
            })}
            <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-full bg-background/80 px-4 py-2 text-center shadow-sm ring-1 ring-border/50">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {mode === "hour" ? "Hora" : "Min"}
              </div>
              <div className="text-base font-semibold tabular-nums">{displayTime}</div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={hourRange === "0-11" ? "default" : "outline"}
            onClick={() => handleRangeChange("0-11")}
            className="min-w-[80px] shadow-none hover:shadow-none hover:translate-y-0"
          >
            0-11
          </Button>
          <Button
            type="button"
            size="sm"
            variant={hourRange === "12-23" ? "default" : "outline"}
            onClick={() => handleRangeChange("12-23")}
            className="min-w-[80px] shadow-none hover:shadow-none hover:translate-y-0"
          >
            12-23
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
