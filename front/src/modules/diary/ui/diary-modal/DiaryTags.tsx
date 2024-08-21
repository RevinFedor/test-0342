import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/shared/ui/components/ui/input';
import { Button } from '@/shared/ui/components/ui/button';
import { Badge } from '@/shared/ui/components/ui/badge';
import { useCreateDiaryTagMutation, useDeleteDiaryTagMutation, useGetAllTagsQuery } from '../../api/tagApi';

interface DiaryTagsProps {
    selectedEntry: any; // Определите тип для selectedEntry на основе фактической структуры данных
}

// Компонент для управления тегами для записи в дневнике
export const DiaryTags: React.FC<DiaryTagsProps> = ({ selectedEntry }) => {
    const [tags, setTags] = useState(selectedEntry.tags); // Состояние для хранения тегов выбранной записи
    const [newTag, setNewTag] = useState(''); // Состояние для хранения нового тега
    const [showSuggestions, setShowSuggestions] = useState(false); // Состояние для управления видимостью предложений
    const inputRef = useRef<HTMLInputElement>(null); // Ссылка на поле ввода
    const suggestionsRef = useRef<HTMLDivElement>(null); // Ссылка на блок с предложениями

    const { data: tagsPrompt, error, isLoading } = useGetAllTagsQuery({}); // Получение всех тегов из API

    const [createDiaryTag] = useCreateDiaryTagMutation(); // Мутация для создания тега
    const [deleteDiaryTag] = useDeleteDiaryTagMutation(); // Мутация для удаления тега

    // Обновление тегов при изменении выбранной записи
    useEffect(() => {
        setTags(selectedEntry.tags);
    }, [selectedEntry]);

    // Обработчики для кликов вне блока с предложениями и нажатия клавиши Escape
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) && inputRef.current && !inputRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && showSuggestions) {
                event.stopPropagation();
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscapeKey);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [showSuggestions]);

    // Обработчик добавления нового тега
    const servHandleAddTag = async () => {
        if (newTag && !tags.some((tag) => tag.name.toLowerCase() === newTag.toLowerCase())) {
            await createDiaryTag({ id: selectedEntry._id, data: { name: newTag } });
            setNewTag('');
            // чтобы заново окно не открывалось
            setShowSuggestions(false);
        }
    };

    // Обработчик удаления тега
    const servHandleDeleteTag = async (tagId: any) => {
        await deleteDiaryTag({ id: selectedEntry._id, data: { tagId } });
    };

    // Обработчик изменения значения поля ввода
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewTag(e.target.value);
        setShowSuggestions(true);
    };

    // Обработчик клика по полю ввода
    const handleInputClick = () => {
        setShowSuggestions(!showSuggestions);
    };

    // Обработчик клика по предложенному тегу
    const handleSuggestionClick = (suggestion: string) => {
        setNewTag(suggestion);
        setShowSuggestions(false);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    // Обработчик нажатий клавиш в поле ввода
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Escape' && showSuggestions) {
            e.stopPropagation();
            setShowSuggestions(false);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            servHandleAddTag();
        }
    };

    if (isLoading) return <p>Loading...</p>;
    if (error) return <p>Error: {error.toString()}</p>;

    // Фильтрация предложений на основе введенного текста и уже существующих тегов
    const filteredSuggestions = tagsPrompt
        ?.filter((tag) => !tags.some((existingTag) => existingTag.name.toLowerCase() === tag.name.toLowerCase()) && tag.name.toLowerCase().includes(newTag.toLowerCase()))
        .sort((a, b) => {
            // Сортировка по дате создания (от новых к старым)
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

    return (
        <div className="relative  ">
            <div className="flex items-center space-x-2 mb-4">
                <div className="relative flex-grow my-2">
                    <Input
                        className="w-full"
                        ref={inputRef}
                        value={newTag}
                        onChange={handleInputChange}
                        onClick={handleInputClick}
                        onKeyDown={handleKeyDown}
                        placeholder="Новый тег"
                    />
                    {showSuggestions && filteredSuggestions.length > 0 && (
                        <div ref={suggestionsRef} className="absolute z-10 w-full mt-4 bg-black p-2 flex flex-wrap  gap-2  rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {filteredSuggestions.map((tag, index) => (
                                <Badge key={index} className="px-2 text-[14px] py-1 cursor-pointer " onClick={() => handleSuggestionClick(tag.name)}>
                                    {tag.name}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
                <Button onClick={servHandleAddTag}>Добавить тег</Button>
            </div>
            <div className="flex flex-wrap gap-2">
                {[...tags]
                    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                    ?.map((tag: any, index: any) => (
                        <Badge key={index} className="text-[13px] text-white hover:bg-red-700 cursor-pointer" onClick={() => servHandleDeleteTag(tag._id)}>
                            {tag.name} ✕
                        </Badge>
                    ))}
            </div>
        </div>
    );
};
