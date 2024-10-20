import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import JSZip from 'jszip';
import { useGetBookByIdQuery } from '../model/booksApiSlice';
import { Loader2 } from 'lucide-react';
import DOMPurify from 'dompurify'; // Для санитизации HTML
import htmlReactParser from 'html-react-parser';

import { ChaptersPopup } from './ChaptersPopup';
import { Chapter } from '../model/types';
import { parseNavPoints, getFullImagePath } from '../model/epubUtils';
import useChapter from '../hooks/useChapter';

const BookReader: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    const { data: bookFile, isLoading: isLoadingContent, error } = useGetBookByIdQuery(id);

    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [currentChapter, setCurrentChapter] = useState<string | null>(null);
    // const [content, setContent] = useState<string | null>(null);
    const [cssContent, setCssContent] = useState<string>('');
    const [images, setImages] = useState<Record<string, string>>({});

    // Загрузка EPUB и парсинг TOC  на главы
    useEffect(() => {
        const loadEpub = async () => {
            if (bookFile) {
                try {
                    const zip = await JSZip.loadAsync(bookFile);

                    // Поиск файла toc.ncx для EPUB 2
                    const tocFile = zip.file(/toc\.ncx$/i)[0];
                    if (!tocFile) {
                        console.error('Файл toc.ncx не найден в EPUB.');
                        return;
                    }

                    const tocContent = await tocFile.async('string');
                    const parser = new DOMParser();
                    const tocDoc = parser.parseFromString(tocContent, 'application/xml');

                    // Получение корневых navPoint
                    const rootNavPoints = tocDoc.querySelectorAll('navMap > navPoint');

                    // Парсинг toc.ncx для получения глав
                    const newChapters = parseNavPoints(rootNavPoints);

                    setChapters(newChapters);
                    setCurrentChapter(newChapters[0]?.href || null); // Установка первой главы по умолчанию

                    // Извлечение всех CSS файлов
                    const cssFiles = Array.from(zip.file(/.*\.css$/i));
                    const cssContents = await Promise.all(cssFiles.map((file) => file.async('string')));
                    setCssContent(cssContents.join('\n'));

                    // Извлечение всех изображений
                    const imageFiles = Array.from(zip.file(/\.(png|jpg|jpeg|gif|svg)$/i));
                    const imageMap: Record<string, string> = {};

                    await Promise.all(
                        imageFiles.map(async (file) => {
                            const data = await file.async('base64');
                            const extensionMatch = file.name.match(/\.(png|jpg|jpeg|gif|svg)$/i);
                            const extension = extensionMatch ? extensionMatch[1].toLowerCase() : 'png';
                            const mimeType = extension === 'svg' ? 'image/svg+xml' : `image/${extension === 'jpg' ? 'jpeg' : extension}`;
                            const dataUri = `data:${mimeType};base64,${data}`;
                            imageMap[file.name] = dataUri;
                        })
                    );

                    setImages(imageMap);
                } catch (err) {
                    console.error('Ошибка при загрузке EPUB:', err);
                }
            }
        };

        loadEpub();
    }, [bookFile]);

    const { content } = useChapter({
        bookFile,
        href: currentChapter,
        images,
    });

    if (isLoadingContent) {
        return <Loader2 />;
    }

    if (error) {
        return <div>Error loading book: {error?.message}</div>;
    }

    return (
        <div className="book-reader" style={{ position: 'relative' }}>
            {/* Внедрение CSS-стилей */}
            {cssContent && <style>{cssContent}</style>}

            {/* Всплывающее окно с оглавлением */}
            <ChaptersPopup mockChapters={chapters} currentChapter={currentChapter} setCurrentChapter={setCurrentChapter} />

            {/* Основное содержимое книги */}

            <div className="chapter-content">{content ? htmlReactParser(content) : <div>Выберите главу для чтения.</div>}</div>
        </div>
    );
};

export default BookReader;
