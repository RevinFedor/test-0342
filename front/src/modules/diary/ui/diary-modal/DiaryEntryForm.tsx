import React, { useEffect, useRef, useState } from 'react';
import { CalendarForm } from '@/shared/ui/CalendarForm';
import ForwardOriginLink from '@/shared/ui/ForwardOriginLink';
import { DiaryEntry } from '../../types/diary';
import { DiaryTags } from '@/modules/diary/ui/diary-modal/DiaryTags';
import Markdown from 'react-markdown';
import { Textarea } from '@/shared/ui/components/ui/textarea';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/ui/components/ui/button';
import { Input } from '@/shared/ui/components/ui/input';

interface DiaryEntryFormProps {
    selectedEntry: DiaryEntry | null;
    isOpen: boolean;
    onUpdate: (id: string, patch: any) => void;
    title: string;
    setTitle: (title: string) => void;
    content: string;
    setContent: (content: string) => void;
}
export const DiaryEntryForm = ({ selectedEntry, isOpen, onUpdate, title, setTitle, content, setContent }: DiaryEntryFormProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [clickPosition, setClickPosition] = useState<number | null>(null);

    const contentRef = useRef<HTMLTextAreaElement>(null);
    const titleRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setIsEditing(false); // Сбрасываем режим редактирования при открытии формы
    }, [isOpen]);

    // установить курсор в Textarea на ту позицию, которую мы сохранили
    useEffect(() => {
        if (isEditing && contentRef.current && clickPosition !== null) {
            contentRef.current.focus();
            contentRef.current.setSelectionRange(clickPosition, clickPosition);
        }
    }, [isEditing, clickPosition]);

    useEffect(() => {
        if (isEditing && contentRef.current) {
            contentRef.current.focus();
        }
    }, [isEditing]);

    const handleTitleBlur = () => {
        if (selectedEntry && title !== selectedEntry.title) {
            onUpdate(selectedEntry._id, { title });
        }
    };

    const handleContentBlur = () => {
        if (selectedEntry && content !== selectedEntry.content) {
            onUpdate(selectedEntry._id, { content });
        }
        setIsEditing(false);
        setClickPosition(null); // Сбрасываем позицию курсора
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            if (e.currentTarget === contentRef.current) {
                handleContentBlur();
            } else if (e.currentTarget === titleRef.current) {
                handleTitleBlur();
                titleRef.current?.blur();
            }
        }
    };

    const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Получаем текущее выделение (если оно есть)
        const selection = window.getSelection();

        // Проверяем, есть ли выделение и если выделение отсутствует, позиция курсора равна 0
        if (selection && selection.rangeCount > 0) {
            // Получаем первый диапазон выделения
            const range = selection.getRangeAt(0);

            // Клонируем диапазон, чтобы работать с его копией
            const preCaretRange = range.cloneRange();

            // Устанавливаем диапазон на всё содержимое элемента, на который кликнули
            preCaretRange.selectNodeContents(e.currentTarget);

            // Ограничиваем конец диапазона текущей позицией курсора или конца выделенного текста
            preCaretRange.setEnd(range.endContainer, range.endOffset);

            // Преобразуем диапазон до курсора в строку
            const selectedText = preCaretRange.toString();

            // Определяем позицию курсора, считая количество символов до конца выделенного текста
            const position = selectedText.length;

            setClickPosition(position);
        } else {
            setClickPosition(0);
        }

        setIsEditing(true);
    };

    return (
        <div>
            <div className="block text-lg mb-2">
                <Input
                    value={title}
                    onChange={handleTitleChange}
                    onBlur={handleTitleBlur}
                    onKeyDown={handleKeyDown}
                    placeholder="Title notes"
                    className="text-3xl font-bold border-none bg-transparent placeholder-gray-500 focus:outline-none focus:ring-0 p-0"
                />
            </div>
            <div className="flex justify-between items-center">
                <CalendarForm
                    initialDate={selectedEntry?.diaryDate ? selectedEntry.diaryDate : null}
                    onDateChange={(newDate: any) => onUpdate(selectedEntry?._id, { diaryDate: newDate.toISOString() })}
                />
                <Button className="">
                    <Link to={selectedEntry?._id}>Open Full Window</Link>
                </Button>
            </div>

            <ForwardOriginLink selectedEntry={selectedEntry} />

            <div className="block text-lg mt-4 mb-2">
                {isEditing ? (
                    <Textarea
                        ref={contentRef}
                        spellCheck="false"
                        onBlur={handleContentBlur}
                        onKeyDown={handleKeyDown}
                        className="text-[18px] h-[500px] resize-none shadow-none w-full px-3 py-2 outline-none  border-none duration-200 bg-[#242424]"
                        value={content}
                        onChange={handleContentChange}
                        style={{ boxShadow: 'none', borderLeft: '2px solid red' }}
                    />
                ) : (
                    <div onClick={handlePreviewClick} className="cursor-text text-[18px] w-full px-3 py-2 border-l-2">
                        <Markdown
                            children={content}
                            components={{
                                p: ({ children }) => <p style={{ marginBottom: '1em', whiteSpace: 'pre-wrap' }}>{children}</p>,
                                h1: ({ children }) => <h1 style={{ fontSize: '2em', fontWeight: 'bold', marginBottom: '0.5em' }}>{children}</h1>,
                                h2: ({ children }) => <h2 style={{ fontSize: '1.5em', fontWeight: 'bold', marginBottom: '0.5em' }}>{children}</h2>,
                                h3: ({ children }) => <h3 style={{ fontSize: '1.17em', fontWeight: 'bold', marginBottom: '0.5em' }}>{children}</h3>,
                                h4: ({ children }) => <h4 style={{ fontSize: '1em', fontWeight: 'bold', marginBottom: '0.5em' }}>{children}</h4>,
                                h5: ({ children }) => <h5 style={{ fontSize: '0.83em', fontWeight: 'bold', marginBottom: '0.5em' }}>{children}</h5>,
                                h6: ({ children }) => <h6 style={{ fontSize: '0.67em', fontWeight: 'bold', marginBottom: '0.5em' }}>{children}</h6>,
                                ul: ({ children }) => <ul style={{ listStyleType: 'disc', paddingLeft: '2em', marginBottom: '1em' }}>{children}</ul>,
                                ol: ({ children }) => (
                                    <ol style={{ listStyleType: 'decimal', paddingLeft: '2em', marginBottom: '1em' }}>{children}</ol>
                                ),
                                li: ({ children }) => <li style={{ marginBottom: '0.5em' }}>{children}</li>,
                                hr: ({ children }) => <hr style={{ marginBottom: '1.5em', marginTop: '1.5em' }}>{children}</hr>,
                            }}
                        />
                    </div>
                )}
            </div>
            <DiaryTags selectedEntry={selectedEntry} />
        </div>
    );
};
