import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TimePickerProps {
  value?: string;
  onChange?: (time: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function TimePicker({
  value,
  onChange,
  placeholder = "Selecione um horário",
  disabled = false,
  className
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

  const selectedHour = value?.split(':')[0] || '';
  const selectedMinute = value?.split(':')[1] || '';

  const handleTimeSelect = (hour: string, minute: string) => {
    if (onChange) {
      onChange(`${hour}:${minute}`);
    }
    setOpen(false);
  };

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
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex divide-x">
          {/* Hours */}
          <div className="flex flex-col">
            <div className="px-4 py-2 text-sm font-medium text-center border-b">
              Horas
            </div>
            <ScrollArea className="h-[200px]">
              <div className="p-2 space-y-1">
                {hours.map((hour) => (
                  <Button
                    key={hour}
                    variant={selectedHour === hour ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-center",
                      selectedHour === hour && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => handleTimeSelect(hour, selectedMinute || '00')}
                  >
                    {hour}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Minutes */}
          <div className="flex flex-col">
            <div className="px-4 py-2 text-sm font-medium text-center border-b">
              Minutos
            </div>
            <ScrollArea className="h-[200px]">
              <div className="p-2 space-y-1">
                {minutes.map((minute) => (
                  <Button
                    key={minute}
                    variant={selectedMinute === minute ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-center",
                      selectedMinute === minute && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => handleTimeSelect(selectedHour || '12', minute)}
                  >
                    {minute}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
