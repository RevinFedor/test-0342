import React, { useState, useEffect, useCallback, memo } from 'react';
import { EventEntry } from '../model/types';
import { getColorGradient, getTimeRange } from '../model/utils';

// Интерфейс для пропсов ячейки сетки
export interface GridCellProps {
    index: number;
    isElapsed: boolean;
    hasEvents: boolean;
    eventsCount: number;
    maxEvents: number;
    onClick: (index: number) => void;
    onHover: (index: number | null) => void;
}

// Компонент ячейки сетки
const GridCell: React.FC<GridCellProps> = ({ index, isElapsed, hasEvents, eventsCount, maxEvents, onClick, onHover }) => {
    // Определяем цвет ячейки в зависимости от количества событий
    const cellColor = hasEvents ? getColorGradient(eventsCount, maxEvents) : '';

    return (
        <div
            className={`border border-[#b4b4b4] ${isElapsed ? 'bg-[#b4b4b4]' : ''} w-3 h-3 m-px transition-all duration-200 ease-in-out`}
            style={{ backgroundColor: cellColor }}
            onClick={() => hasEvents && onClick(index)}
            onMouseEnter={() => onHover(index)}
            onMouseLeave={() => onHover(null)}
        />
    );
};

// Интерфейс для пропсов компонента сетки
interface GridProps {
    elapsedTime: number;
    getWeekEvents: (weekIndex: number) => EventEntry[];
    onCellClick: (index: number) => void;
    onCellHover: (index: number | null) => void;
}

// Мемоизированный компонент сетки
export const Grid: React.FC<GridProps> = memo(({ elapsedTime, getWeekEvents, onCellClick, onCellHover }) => {
    const [maxEvents, setMaxEvents] = useState(1);

    // макс количества событий для определения цвета
    useEffect(() => {
        let max = 1;
        for (let i = 0; i < 4680; i++) {
            const weekEvents = getWeekEvents(i);
            if (weekEvents.length > max) {
                max = weekEvents.length;
            }
        }
        setMaxEvents(max);
    }, [getWeekEvents]);

    return (
        <div className={`grid grid-cols-[repeat(52,minmax(0,1fr))] gap-y-[5px] gridContainer`}>
            {Array.from({ length: 4680 }, (_, i) => {
                const weekEvents = getWeekEvents(i);
                
                return (
                    <GridCell
                        key={i}
                        index={i}
                        isElapsed={i < elapsedTime}
                        hasEvents={weekEvents.length > 0}
                        eventsCount={weekEvents.length}
                        maxEvents={maxEvents}
                        onClick={onCellClick}
                        onHover={onCellHover}

                    />
                );
            })}
        </div>
    );
});
