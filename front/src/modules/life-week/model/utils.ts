// utils.ts
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DobState } from './types';

/**
 * Функция для вычисления градиента цвета в зависимости от количества событий
 * @param eventCount - количество событий
 * @param maxEvents - максимальное количество событий
 * @returns строка с RGB-представлением цвета
 */
export const getColorGradient = (eventCount: number, maxEvents: number): string => {
    const startColor = [173, 216, 230]; // Light blue
    const endColor = [0, 0, 255]; // Dark blue

    const ratio = Math.min(eventCount > 6 ? 6 : eventCount / maxEvents, 1);
    const r = Math.round(startColor[0] + ratio * (endColor[0] - startColor[0]));
    const g = Math.round(startColor[1] + ratio * (endColor[1] - startColor[1]));
    const b = Math.round(startColor[2] + ratio * (endColor[2] - startColor[2]));

    return `rgb(${r}, ${g}, ${b})`;
};

/**
 * Функция для получения временного диапазона для ячейки
 * @param dateOfBirth - дата рождения
 * @param index - индекс недели
 * @returns строка с диапазоном дат
 */
export const getTimeRange = (dateOfBirth: Date, index: number): string => {
    const yearsElapsed = Math.floor(index / 52);
    const weeksInCurrentYear = index % 52;

    const yearStart = new Date(dateOfBirth.getFullYear() + yearsElapsed, dateOfBirth.getMonth(), dateOfBirth.getDate());
    const startDate = new Date(yearStart.getTime() + weeksInCurrentYear * 7 * 24 * 60 * 60 * 1000);
    let endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Проверяем, является ли эта неделя последней в году
    const nextYearStart = new Date(yearStart.getFullYear() + 1, yearStart.getMonth(), yearStart.getDate());
    if (endDate > nextYearStart) {
        endDate = new Date(nextYearStart.getTime() - 24 * 60 * 60 * 1000); // Последний день перед следующим днем рождения
    }

    return `${startDate.toDateString()} - ${endDate.toDateString()}`;
};

/**
 * Кастомный хук для работы с датой рождения
 * @returns объект с данными о дате рождения и функциями для работы с ней
 */
export const useDob = () => {
    const [dob, setDob] = useState<DobState>({ month: '6', day: '17', year: '2004' });
    const [elapsedTime, setElapsedTime] = useState<number>(0);

    // Вычисляем дату рождения на основе введенных данных
    const dateOfBirth = useMemo(() => new Date(Number(dob.year), Number(dob.month) - 1, Number(dob.day)), [dob]);

    // Проверяем, валидна ли введенная дата
    const dateIsValid = useCallback((): boolean => {
        return dob.month !== '' && dob.day !== '' && dob.year !== '';
    }, [dob]);

    // Вычисляем количество прошедших недель с даты рождения
    const calculateElapsedTime = useCallback((): number => {
        const currentDate = new Date();
        const yearsDiff = currentDate.getFullYear() - dateOfBirth.getFullYear();
        const monthsDiff = currentDate.getMonth() - dateOfBirth.getMonth();
        const daysDiff = currentDate.getDate() - dateOfBirth.getDate();

        // прошедшие года, без учета дней
        let totalWeeks = yearsDiff * 52;

        // Добавляем недели за месяцы
        totalWeeks += Math.floor(monthsDiff * 4.348); // Примерное количество недель в месяце

        // Добавляем недели за дни
        totalWeeks += Math.floor(daysDiff / 7);

        return totalWeeks;

        //! старый пример где было больше недель, и хотя это значение более правильное, в новом примере мы просто будем добавлять пропущенные дни в конец
        const diff = currentDate.getTime() - dateOfBirth.getTime();
        console.log(Math.floor(diff / (7 * 24 * 60 * 60 * 1000)));
    }, [dateOfBirth]);

    // Эффект для обновления прошедшего времени при изменении даты рождения
    useEffect(() => {
        if (dateIsValid()) {
            const count = calculateElapsedTime();
            setElapsedTime(count);
        } else {
            setElapsedTime(0);
        }
    }, [dob, dateIsValid, calculateElapsedTime]);

    return { dob, setDob, elapsedTime, dateOfBirth };
};
