import React, { useRef, useCallback, useState } from 'react';
import { Input } from '@/shared/ui/components/ui/input';
import { Button } from '@/shared/ui/components/ui/button';

interface ChapterSplitInputProps {
    value: number;
    onChange: (value: number) => void;
    onProcessBook?: () => void;
}

export const ChapterSplitInput: React.FC<ChapterSplitInputProps> = ({ value, onChange }) => {
    const [inputValue, setInputValue] = useState(value.toString());

    // Обработчик изменения значения в поле ввода
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    }, []);

    // Обработчик подтверждения изменения (при потере фокуса или нажатии Enter)
    const handleConfirmChange = useCallback(() => {
        const newValue = parseInt(inputValue, 10);
        if (!isNaN(newValue) && newValue > 0) {
            onChange(newValue);
        } else {
            // Если введено некорректное значение, возвращаем предыдущее
            setInputValue(value.toString());
        }
    }, [inputValue, onChange, value]);

    // Обработчик нажатия клавиши Enter
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
                handleConfirmChange();
            }
        },
        [handleConfirmChange]
    );

    return (
        <div className="my-4 flex items-center">
            <label htmlFor="chapterSplitLimit" className="mr-2 text-sm font-medium text-gray-700">
                Лимит символов для разделения главы:
            </label>
            <Input
                type="text"
                id="chapterSplitLimit"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleConfirmChange}
                onKeyDown={handleKeyDown}
                className="w-32 mr-2"
            />
        </div>
    );
};
