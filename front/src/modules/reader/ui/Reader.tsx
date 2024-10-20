import React, { useState, useCallback, useEffect } from 'react';
import ePub, { Book } from 'epubjs';
import { ChapterList } from './ChapterList';
import { FileUploader } from './FileUploader';
import { ChapterSplitInput } from './ChapterSplitInput';
import { processBook } from '../model/utils';
import { Chapter, HighlightAndNote } from '../model/types';
import { saveBookToLocalStorage, loadBookFromLocalStorage } from '../model/utils';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/shared/ui/components/ui/select';
import TextToSpeech from './TextToSpeech';
import { FileJson2 } from 'lucide-react';

const Reader: React.FC = () => {
    const [book, setBook] = useState<Book | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [chapterSplitLimit, setChapterSplitLimit] = useState<number>(() => {
        const saved = localStorage.getItem('chapterSplitLimit');
        return saved ? parseInt(saved, 10) : 30000;
    });
    const [selectedReader, setSelectedReader] = useState('aquile');

    useEffect(() => {
        const loadSavedBook = async () => {
            const { book: savedBook, chapters: savedChapters } = await loadBookFromLocalStorage();
            if (savedBook && savedChapters.length > 0) {
                setBook(savedBook);
                setChapters(savedChapters);
            }
        };

        loadSavedBook();
    }, []);

    useEffect(() => {
        if (book && chapters.length > 0) {
            saveBookToLocalStorage(book, chapters);
        }
    }, [book, chapters]);

    const handleFile = useCallback(
        async (file: File) => {
            setLoading(true);
            setError('');
            try {
                const reader = new FileReader();
                reader.onload = async (e: ProgressEvent<FileReader>) => {
                    if (e.target && e.target.result) {
                        const bookData = e.target.result;
                        const newBook = ePub(bookData as ArrayBuffer);
                        setBook(newBook);
                        const processedChapters = await processBook(newBook, chapterSplitLimit);

                        
                        setChapters(processedChapters);
                        saveBookToLocalStorage(newBook, processedChapters);
                    }
                };
                reader.readAsArrayBuffer(file);
            } catch (err) {
                setError(`Ошибка при загрузке файла: ${(err as Error).message}`);
            } finally {
                setLoading(false);
            }
        },
        [chapterSplitLimit]
    );


    // Функция для обработки изменения лимита разделения глав
    const handleChapterSplitLimitChange = useCallback(
        async (newLimit: number) => {
            // Проверяем, что новый лимит отличается от текущего
            if (newLimit !== chapterSplitLimit) {
                setChapterSplitLimit(newLimit);
                localStorage.setItem('chapterSplitLimit', newLimit.toString());

                // Если книга загружена, пересчитываем главы
                if (book) {
                    setLoading(true);
                    try {
                        const processedChapters = await processBook(book, newLimit);
                        setChapters(processedChapters);
                        saveBookToLocalStorage(book, processedChapters);
                    } catch (err) {
                        setError(`Ошибка при обработке книги: ${(err as Error).message}`);
                    } finally {
                        setLoading(false);
                    }
                }
            }
        },
        [book, chapterSplitLimit]
    );

    const normalizeChapterTitle = (title: string): string => {
        const parts = title.split('»');
        if (parts.length > 1) {
            return parts[parts.length - 1].trim();
        }
        return title.trim();
    };

    const handleNotesFile = useCallback(async (file: File) => {
        try {
            const text = await file.text();
            const notesData = JSON.parse(text);

            // Парсим заметки и отфильтровываем те, которые не удалены
            const notes: HighlightAndNote[] = notesData.$values.filter((note: HighlightAndNote) => !note.IsDeleted);

            const notesMap: Record<string, HighlightAndNote[]> = {};
            notes.forEach((note) => {
                const chapterTitle = normalizeChapterTitle(note.SelectionTocLocation);
                if (!notesMap[chapterTitle]) {
                    notesMap[chapterTitle] = [];
                }
                notesMap[chapterTitle].push(note);
            });

            console.log(notesMap);

            // Обновляем главы с отфильтрованными заметками
            setChapters((prevChapters) =>
                prevChapters.map((chapter) => ({
                    ...chapter,
                    notes: notesMap[normalizeChapterTitle(chapter.title)] || [],
                }))
            );
        } catch (error) {
            console.error('Ошибка при загрузке файла:', error);
        }

        console.log('Updated chapters:', chapters);
    }, []);


    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center gap-5">
                <FileUploader
                    onFileSelect={handleFile}
                    loading={loading}
                    error={error}
                    title="EPUB Reader"
                    acceptedFileTypes={{ 'application/epub+zip': ['.epub'] }}
                    loadingText="Загрузка и обработка EPUB файла..."
                    className="w-full h-[230px]"
                />
                <FileUploader
                    onFileSelect={handleNotesFile}
                    loading={loading}
                    error={error}
                    title="Highlighting notes"
                    acceptedFileTypes={{ 'application/json': ['.json'] }}
                    loadingText="Загрузка и обработка файла заметок..."
                    icon={<FileJson2 className="mx-auto h-12 w-12 text-gray-400" />}
                    className="w-full h-[230px]"
                />
            </div>

            <TextToSpeech />
            <ChapterSplitInput value={chapterSplitLimit} onChange={handleChapterSplitLimitChange} />
            <h3 className="mb-5">Exporting Reader</h3>
            <Select value={selectedReader} onValueChange={setSelectedReader}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem value="aquile">Aquile Reader</SelectItem>
                        <SelectItem value="pocketbook">PocketBook</SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>

            <ChapterList chapters={chapters} />
        </div>
    );
};

export default Reader;
