import React, { useState, useCallback, useEffect } from 'react';
import { useGetDiaryDatesQuery } from '@/modules/diary/api/diaryApi';
import { Link } from 'react-router-dom';
import { EventEntry, DiaryDatesQueryResult } from '../model/types';
import { useDob, getTimeRange } from '../model/utils';
import { Grid } from './Grid';
import { Labels } from './Labels';
import { Select } from './Select';

const LifeWeeksChart: React.FC = () => {
    // Используем кастомный хук для работы с датой рождения
    const { dob, setDob, elapsedTime, dateOfBirth } = useDob();
    const [selectedCell, setSelectedCell] = useState<number | null>(null);
    const [hoveredCell, setHoveredCell] = useState<number | null>(null);
    const [renderedGrid, setRenderedGrid] = useState<React.ReactNode | null>(null);
    const [isRendering, setIsRendering] = useState(true);

    // Получаем данные о событиях из API
    const { data: eventData, isSuccess } = useGetDiaryDatesQuery({}) as DiaryDatesQueryResult;

    // loader для загрузки Grid комопнента
    useEffect(() => {
        setIsRendering(true);
        const renderTimer = setTimeout(() => {
            const grid = <Grid elapsedTime={elapsedTime} getWeekEvents={getWeekEvents} onCellClick={handleCellClick} onCellHover={handleCellHover} />;

            if (isSuccess) {
                setRenderedGrid(grid);
                setIsRendering(false);
            }
        }, 0);

        return () => clearTimeout(renderTimer);
    }, [elapsedTime, isSuccess]);

    // Функция для получения событий недели по индексу
    const getWeekEvents = useCallback(
        (weekIndex: number): EventEntry[] => {
            if (!isSuccess || !eventData) return [];

            // колличество всего лет
            const yearsElapsed = Math.floor(weekIndex / 52);
            // колличество заполненых недель в текущем году
            const weeksInCurrentYear = weekIndex % 52;

            // дата начала года (с даты роджения)
            const yearStart = new Date(dateOfBirth.getFullYear() + yearsElapsed, dateOfBirth.getMonth(), dateOfBirth.getDate());

            // дата начала и конец текущей недели
            const weekStartDate = new Date(yearStart.getTime() + weeksInCurrentYear * 7 * 24 * 60 * 60 * 1000);
            let weekEndDate = new Date(weekStartDate.getTime() + 7 * 24 * 60 * 60 * 1000);

            // Если это последняя неделя года, устанавливаем конец недели на день перед следующим днем рождения
            if (weeksInCurrentYear === 51) {
                const nextBirthday = new Date(yearStart.getFullYear() + 1, yearStart.getMonth(), yearStart.getDate());
                weekEndDate = new Date(nextBirthday.getTime() - 24 * 60 * 60 * 1000);
            }
            if (weeksInCurrentYear === 51) {
                const nextBirthday = new Date(yearStart.getFullYear() + 1, yearStart.getMonth(), yearStart.getDate());
                weekEndDate = new Date(nextBirthday.getTime() - 24 * 60 * 60 * 1000);
            }

            // выводит массив из entries занеделю. flatMap выводит конкретно entries
            return eventData
                .filter((event) => {
                    const date = new Date(event.date);
                    return date >= weekStartDate && date <= weekEndDate;
                })
                .flatMap((event) => event.entries);
        },
        [isSuccess, eventData, dateOfBirth]
    );

    // Обработчики клика и наведения на ячейку
    const handleCellClick = useCallback((index: number): void => {
        setSelectedCell(index);
    }, []);

    const handleCellHover = useCallback((index: number | null): void => {
        setHoveredCell(index);
    }, []);

    if (isRendering) {
        return (
            <div className="w-full h-screen flex items-center justify-center">
                <div className="text-2xl">Loading Life Weeks Chart...</div>
            </div>
        );
    }

    return (
        <div className="w-[1080px] mx-auto p-4">
            <Select dob={dob} setDob={setDob} />

            {hoveredCell !== null && (
                <div className="flex justify-center text-center mb-4 absolute left-1/2 transform -translate-y-1/2">
                    {getTimeRange(dateOfBirth, hoveredCell)}
                </div>
            )}

            <div className="relative mt-[100px]">
                <Labels />
                {renderedGrid}

                {selectedCell !== null && (
                    <div className="absolute left-full transform translate-x-2 top-0 bg-white text-black border border-gray-300 p-2 rounded shadow-lg max-h-[600px] w-[400px] overflow-y-auto">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold mb-2">{getTimeRange(dateOfBirth, selectedCell)}</h3>
                            <button className="font-bold mb-2 text-red-500 px-3" onClick={() => setSelectedCell(null)}>
                                close
                            </button>
                        </div>

                        <ul>
                            {getWeekEvents(selectedCell).map((entry) => (
                                <li key={entry.id} className="mb-1 border border-black rounded-lg px-2">
                                    <Link to={`/${entry.id}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                        {entry.title || `Entry ${entry.id.substr(0, 8)}...`}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="flex justify-between mt-4 text-xs">
                <span>BIRTH (17 June 2004)</span>
                <span className="text-center">MAKE EACH AND EVERY DAY COUNT</span>
                <span>90 YEARS</span>
            </div>
        </div>
    );
};

export default LifeWeeksChart;
