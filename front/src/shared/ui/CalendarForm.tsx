import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/components/ui/button';
import { Calendar } from '@/shared/ui/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/components/ui/popover';

interface CalendarFormProps {
    initialDate: Date | null;
    onDateChange: (date: Date) => void;
    className?: string;
}

// 
export function CalendarForm({ initialDate, onDateChange, className }: CalendarFormProps) {
    const handleDateSelect = (selectedDate: Date) => {
        onDateChange(selectedDate); // Вызываем колбэк при выборе даты
        
    };

    

    return (
        <div className={`mb-2 ${className}`}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant={'outline'}
                        className={cn('w-full max-w-[280px] justify-start text-left font-normal ', !initialDate && 'text-muted-foreground')}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {initialDate ? format(initialDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="flex w-auto flex-col space-y-2 p-2">
                    <div className="rounded-md border">
                        <div onClick={(event) => event.stopPropagation()}>
                            <Calendar
                                mode="single"
                                selected={initialDate ? new Date(initialDate) : undefined}
                                //@ts-ignore
                                onSelect={handleDateSelect}
                            />
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
