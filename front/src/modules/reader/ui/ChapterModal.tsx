import React, { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/components/ui/card';
import { Badge } from '@/shared/ui/components/ui/badge';
import { Button } from '@/shared/ui/components/ui/button';
import { Switch } from '@/shared/ui/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/components/ui/popover';
import { Input } from '@/shared/ui/components/ui/input';
import { HighlightAndNote } from '../model/types';
import { Clipboard, Search, Globe, MessageSquare, Speech } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { setText } from '../model/textToSpeechSlice';
import { useAppDispatch } from '@/app/providers/config/store';

interface ChapterModalProps {
    title: string;
    content: string;
    notes?: HighlightAndNote[];
}

const ChapterModal: React.FC<ChapterModalProps> = ({ title, content, notes: initialNotes = [] }) => {
    const [showNotes, setShowNotes] = useState(false);
    const [notes, setNotes] = useState(initialNotes);
    const [selectedText, setSelectedText] = useState('');
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
    const [commentText, setCommentText] = useState('');
    const [isCommentMode, setIsCommentMode] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const dispatch = useAppDispatch();

    const colorMap: Record<string, string> = {
        '1': 'bg-note-yellow',
        '2': 'bg-note-green',
        '3': 'bg-note-orange',
        '4': 'bg-note-pink',
        '5': 'bg-note-gray',
        '6': 'bg-note-blue',
    };

    const handleTextSelection = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const contentRect = contentRef.current?.getBoundingClientRect();

            if (contentRect) {
                setPopoverPosition({
                    top: rect.top - contentRect.top - 40,
                    left: rect.left - contentRect.left + rect.width / 2,
                });
            }

            setSelectedText(selection.toString().trim());
            setIsPopoverOpen(true);
            setIsCommentMode(false);
        } else {
            setIsPopoverOpen(false);
        }
    }, []);

    const handleContextMenu = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            handleTextSelection(e);
        },
        [handleTextSelection]
    );

    const clearSelection = () => {
        if (window.getSelection) {
            window.getSelection()?.removeAllRanges();
        }
    };

    const handleColorSelect = (colorId: string) => {
        const newNote: HighlightAndNote = {
            Id: uuidv4(),
            SelectionSnippet: selectedText,
            ColorId: colorId,
            NoteText: commentText,
            Type: 0,
            TimeStamp: new Date().toISOString(),
            SelectionTocLocation: title,
            IsDeleted: false,
        };

        console.log(newNote);

        setNotes([...notes, newNote]);
        setIsPopoverOpen(false);
        clearSelection();
        setSelectedText('');
        setCommentText('');
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(selectedText);
        setIsPopoverOpen(false);
        clearSelection();
    };

    const handleSearch = () => {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(selectedText)}`, '_blank');
        setIsPopoverOpen(false);
        clearSelection();
    };

    const handleTranslate = () => {
        window.open(`https://translate.yandex.com/?text=${encodeURIComponent(selectedText)}`, '_blank');
        setIsPopoverOpen(false);
        clearSelection();
    };

    const handleSpeech = () => {
        dispatch(setText(selectedText));
        setIsPopoverOpen(false);
        clearSelection();
    };

    const handleAddComment = () => {
        setIsCommentMode(true);
    };

    const renderHighlightedContent = () => {
        let highlightedContent = content;
        notes.forEach((note) => {
            const regex = new RegExp(`(${note.SelectionSnippet})`, 'gi');
            highlightedContent = highlightedContent.replace(
                regex,
                `<span class="${colorMap[note.ColorId]} cursor-pointer" data-note-id="${note.Id}">$1</span>`
            );
        });
        return <p dangerouslySetInnerHTML={{ __html: highlightedContent }} className="text-justify text-[16px]" />;
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    Открыть
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex justify-between items-center">
                        {title}
                        <div className="flex items-center space-x-2">
                            <span>Глава</span>
                            <Switch checked={showNotes} onCheckedChange={setShowNotes} />
                            <span>Заметки</span>
                        </div>
                    </DialogTitle>
                </DialogHeader>
                <div className="mt-4 whitespace-pre-wrap relative" onMouseUp={handleTextSelection} onContextMenu={handleContextMenu} ref={contentRef}>
                    {showNotes ? (
                        notes.length ? (
                            notes.map((note, index) => (
                                <Card key={index} className="mb-4">
                                    <CardHeader>
                                        <Badge variant="outline" className={`mr-2 ${colorMap[note.ColorId]}`}>
                                            {note.Type === 0 ? '✏️' : '💬'}
                                        </Badge>
                                        <CardTitle className="text-lg">{note.SelectionSnippet}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {note.NoteText && (
                                            <CardDescription className="text-sm text-gray-600 mt-1">Заметка: {note.NoteText}</CardDescription>
                                        )}
                                        <CardDescription className="text-sm text-gray-600 mt-1">
                                            Время: {new Date(note.TimeStamp).toLocaleString()}
                                        </CardDescription>
                                        <CardDescription className="text-sm text-gray-600">Положение: {note.SelectionPosition}</CardDescription>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <CardDescription>Нет заметок для этой главы</CardDescription>
                        )
                    ) : (
                        renderHighlightedContent()
                    )}
                    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                        <PopoverTrigger asChild>
                            <div style={{ position: 'absolute', top: popoverPosition.top, left: popoverPosition.left }} />
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2" style={{ transform: 'translateX(-50%)' }}>
                            {isCommentMode ? (
                                <div className="flex flex-col space-y-2">
                                    <Input placeholder="Введите комментарий" value={commentText} onChange={(e) => setCommentText(e.target.value)} />
                                    <div className="flex justify-between">
                                        <Button variant="outline" size="sm" onClick={() => setIsCommentMode(false)}>
                                            Отмена
                                        </Button>
                                        <Button size="sm" onClick={() => handleColorSelect('1')}>
                                            Сохранить
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex space-x-2">
                                    <Button variant="outline" size="icon" onClick={handleCopy}>
                                        <Clipboard className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={handleSearch}>
                                        <Search className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={handleTranslate}>
                                        <Globe className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={handleAddComment}>
                                        <MessageSquare className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={handleSpeech}>
                                        <Speech className="h-4 w-4" />
                                    </Button>
                                    {Object.entries(colorMap).map(([colorId, colorClass]) => (
                                        <Button
                                            key={colorId}
                                            className={`${colorClass} h-8 w-8 rounded-none border-0`}
                                            variant="ghost"
                                            onClick={() => handleColorSelect(colorId)}
                                        />
                                    ))}
                                </div>
                            )}
                        </PopoverContent>
                    </Popover>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ChapterModal;
