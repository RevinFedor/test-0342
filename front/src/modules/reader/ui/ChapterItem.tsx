import React, { useState, useRef } from 'react';
import { Button } from '@/shared/ui/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/components/ui/popover';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { Chapter, HighlightAndNote } from '../model/types';
import { formatCharCount } from '../model/utils';
import ChapterModal from './ChapterModal';

interface ChapterItemProps {
    chapter: Chapter;
    index: number;
    expanded: boolean;
    copiedState: boolean;
    onToggle: () => void;
    onCopy: (text: string) => void;
    isTopLevel?: boolean;
}

export const ChapterItem: React.FC<ChapterItemProps> = ({ chapter, expanded, copiedState, onToggle, onCopy, isTopLevel = true }) => {
    const [popupOpen, setPopupOpen] = useState(false);
    const [popupCopied, setPopupCopied] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const truncateTitle = (title: string, maxLength: number) => {
        return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
    };

    const formatNotes = (notes: HighlightAndNote[]) => {
        return notes
            .map(
                (note) =>
                    `Выделение: ${note.SelectionSnippet}\n` +
                    `Цвет: ${note.ColorId}\n` +
                    (note.NoteText ? `Коментарий: ${note.NoteText}\n` : '') +
                    `Расположение в оглавлении: ${note.SelectionTocLocation}\n`
            )
            .join('\n\n');
    };

    const copyContent = () => {
        const chapterContent = chapter.content || chapter.parts?.map((p) => p.content).join('\n\n') || '';
        const notesContent = chapter.notes ? `\n\nНиже представлены заметки по данной главе:\n\n${formatNotes(chapter.notes)}` : '';
        onCopy(chapterContent + notesContent);
    };

    const copyPopupContent = () => {
        const content = chapter.content || chapter.parts?.map((p) => p.content).join('\n\n') || '';
        navigator.clipboard.writeText(content).then(() => {
            setPopupCopied(true);
            setTimeout(() => setPopupCopied(false), 2000);
        });
    };

    const handleMouseEnter = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setPopupOpen(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setPopupOpen(false);
        }, 300); // Задержка в 300 мс перед закрытием
    };

    return (
        <div className={`border rounded mb-1 ${!isTopLevel ? 'p-0' : 'p-[5px]'}`}>
            <div
                className={`flex items-center justify-between group cursor-pointer ${isTopLevel && !chapter.parts && 'ml-[30px]'} ${
                    !isTopLevel && 'ml-4'
                }`}
                onClick={onToggle}
            >
                <Popover open={popupOpen} onOpenChange={setPopupOpen}>
                    <PopoverTrigger asChild>
                        <span className="font-semibold flex items-center relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                            {chapter.parts && (expanded ? <ChevronDown className="mr-2" /> : <ChevronRight className="mr-2" />)}

                            {truncateTitle(chapter.title, 50)}
                        </span>
                    </PopoverTrigger>
                    {chapter.title.length > 50 && (
                        <PopoverContent
                            className="w-96 max-h-60 overflow-y-auto"
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                            align="start"
                        >
                            <p className="text-sm mb-2">{chapter.title}</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    copyPopupContent();
                                }}
                            >
                                {popupCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                                {popupCopied ? 'Скопировано' : 'Копировать'}
                            </Button>
                        </PopoverContent>
                    )}
                </Popover>

                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">({formatCharCount(chapter.charCount)} символов)</span>
                    {chapter.notes && <span className="text-sm text-blue-500">({chapter.notes.length} заметок)</span>}
                    <ChapterModal
                        title={chapter.title}
                        content={chapter.content || chapter.parts?.map((p) => p.content).join('\n\n') || ''}
                        notes={chapter.notes}
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            copyContent();
                        }}
                    >
                        {copiedState ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                    </Button>
                </div>
            </div>
            {expanded && chapter.parts && (
                <div className="mt-2 pl-6">
                    {chapter.parts.map((part, partIndex) => (
                        <ChapterItem
                            key={partIndex}
                            chapter={part}
                            index={partIndex}
                            expanded={false}
                            copiedState={copiedState}
                            onToggle={() => {}}
                            onCopy={onCopy}
                            isTopLevel={false}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
