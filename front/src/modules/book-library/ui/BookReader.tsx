//! финальная версия  + сделал вложенные заголовки

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import JSZip from 'jszip';
import { useGetBookByIdQuery } from '../model/booksApiSlice';
import { ScrollArea } from '@/shared/ui/components/ui/scroll-area';
import { Button } from '@/shared/ui/components/ui/button';
import { Loader2 } from 'lucide-react';
import DOMPurify from 'dompurify'; // Для санитизации HTML
import htmlReactParser from 'html-react-parser';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/components/ui/popover';

interface Chapter {
    label: string;
    href: string;
    cfi: string; // CFI можно вычислить позже, если потребуется
    level: number; // Представляет уровень вложенности
}

const parseNavPoints = (navPoints: NodeListOf<Element>, currentLevel: number = 1): Chapter[] => {
    let chapters: Chapter[] = [];

    navPoints.forEach((navPoint) => {
        const label = navPoint.querySelector('navLabel > text')?.textContent || 'Глава';
        const href = navPoint.querySelector('content')?.getAttribute('src') || '';

        chapters.push({
            label,
            href,
            cfi: '',
            level: currentLevel,
        });

        // Проверка на наличие вложенных navPoint
        const childNavPoints = navPoint.querySelectorAll(':scope > navPoint');
        if (childNavPoints.length > 0) {
            chapters = chapters.concat(parseNavPoints(childNavPoints, currentLevel + 1));
        }
    });

    return chapters;
};

const BookReader: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    // Получение данных книги с сервера
    const { data: bookFile, isLoading: isLoadingContent, error } = useGetBookByIdQuery(id);

    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [currentChapter, setCurrentChapter] = useState<string | null>(null);
    const [content, setContent] = useState<string | null>(null);
    const [cssContent, setCssContent] = useState<string>('');
    const [images, setImages] = useState<Record<string, string>>({});

    // Загрузка EPUB и парсинг TOC
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

    // Загрузка содержимого текущей главы
    useEffect(() => {
        const loadChapterContent = async (href: string) => {
            if (href && bookFile) {
                try {
                    const zip = await JSZip.loadAsync(bookFile);

                    // Удаление фрагмента из href, если он присутствует
                    const baseHref = href.split('#')[0];

                    // Поиск файла главы внутри EPUB
                    let chapterFile = zip.file(`OPS/${baseHref}`);
                    if (!chapterFile) {
                        // Попытка найти файл без учета регистра
                        const availableFiles = Object.keys(zip.files);
                        const similarFile = availableFiles.find((file) => file.toLowerCase() === baseHref.toLowerCase());
                        if (similarFile) {
                            chapterFile = zip.file(similarFile);
                            console.warn(`Найден файл с похожим именем: ${similarFile}`);
                        } else {
                            console.error(`Файл главы не найден: ${baseHref}`);
                            return;
                        }
                    }

                    let contentFile = await chapterFile.async('string');

                    // Удаление декларации XML, если она есть
                    contentFile = contentFile.replace(/<\?xml.*?\?>\s*/g, '');

                    // Парсинг содержимого и извлечение <body>
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(contentFile, 'application/xhtml+xml');
                    const body = doc.body;

                    if (body) {
                        // Обработка изображений внутри <img> и <image> тегов
                        const imagesInContent = body.querySelectorAll('img, image');

                        imagesInContent.forEach((imgElement) => {
                            if (imgElement.tagName.toLowerCase() === 'img') {
                                const src = imgElement.getAttribute('src');
                                if (src) {
                                    const imagePath = getFullImagePath(baseHref, src);
                                    const imageUri = images[imagePath] || images[src];
                                    if (imageUri) {
                                        imgElement.setAttribute('src', imageUri);
                                    } else {
                                        console.warn(`Изображение не найдено: ${src}`);
                                    }
                                }
                            } else if (imgElement.tagName.toLowerCase() === 'image') {
                                const hrefAttr = imgElement.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
                                if (hrefAttr) {
                                    const imagePath = getFullImagePath(baseHref, hrefAttr);
                                    const imageUri = images[imagePath] || images[hrefAttr];
                                    if (imageUri) {
                                        imgElement.setAttributeNS('http://www.w3.org/1999/xlink', 'href', imageUri);
                                    } else {
                                        console.warn(`Изображение не найдено: ${hrefAttr}`);
                                    }
                                }
                            }
                        });

                        // Сериализация обновленного HTML
                        const serializer = new XMLSerializer();
                        let bodyContent = serializer.serializeToString(body);

                        // Санитизация HTML для безопасности
                        bodyContent = DOMPurify.sanitize(bodyContent);

                        setContent(bodyContent);
                    } else {
                        console.error('Тег <body> не найден в содержимом главы.');
                    }
                } catch (err) {
                    console.error('Ошибка при загрузке содержимого главы:', err);
                }
            }
        };

        if (currentChapter) {
            loadChapterContent(currentChapter);
        }
    }, [currentChapter, bookFile, images]);

    /**
     * Функция для получения полного пути к изображению на основе пути главы и относительного пути к изображению.
     * @param baseHref Базовый путь к файлу главы.
     * @param src Относительный путь к изображению внутри главы.
     * @returns Полный путь к изображению.
     */
    const getFullImagePath = (baseHref: string, src: string): string => {
        if (src.startsWith('/')) {
            // Абсолютный путь относительно корня EPUB
            return src.substring(1);
        } else {
            // Относительный путь относительно директории главы
            const chapterPath = baseHref.substring(0, baseHref.lastIndexOf('/') + 1);
            return chapterPath + src;
        }
    };

    if (isLoadingContent) {
        return <Loader2 />;
    }

    if (error) {
        return <div>Error loading book: {error.message}</div>;
    }
    console.log(chapters);

    return (
        <div className="book-reader" style={{ position: 'relative' }}>
            {/* Внедрение CSS-стилей */}
            {cssContent && <style>{cssContent}</style>}

            {/* Всплывающее окно с оглавлением */}
            <Popover>
                <PopoverTrigger>Open Char</PopoverTrigger>
                <PopoverContent className="h-[400px] w-full overflow-y-auto overflow-x-hidden">
                    {' '}
                    {chapters.map((chapter, index) => (
                        <div
                            key={index}
                            onClick={() => setCurrentChapter(chapter.href)}
                            className="flex flex-col max-w-[330px] cursor-pointer hover:bg-slate-400"
                            style={{
                                paddingLeft: chapter.level > 1 ? `${chapter.level * 20}px` : undefined,
                            }}
                        >
                            {chapter.label}
                        </div>
                    ))}
                </PopoverContent>
            </Popover>

            {/* Основное содержимое книги */}

            <div className="chapter-content">{content ? htmlReactParser(content) : <div>Выберите главу для чтения.</div>}</div>
        </div>
    );
};

export default BookReader;
