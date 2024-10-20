// работат переход по главам для epub2\3 и картинки с html, но  нету наваний глав и порядка




import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import JSZip from 'jszip';
import { useGetBookByIdQuery } from '../model/booksApiSlice';
import { ScrollArea } from '@/shared/ui/components/ui/scroll-area';
import { Button } from '@/shared/ui/components/ui/button';
import { Loader2 } from 'lucide-react';
import DOMPurify from 'dompurify'; // Для санитизации HTML
import htmlReactParser from 'html-react-parser';

interface Chapter {
    label: string;
    href: string;
    cfi: string; // CFI can be computed later if needed
    level: number; // Represents nesting level
}

const BookReader: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    // Fetch book data from server
    const { data: bookFile, isLoading: isLoadingContent, error } = useGetBookByIdQuery(id);

    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [currentChapter, setCurrentChapter] = useState<string | null>(null);
    const [content, setContent] = useState<string | null>(null);
    const [cssContent, setCssContent] = useState<string>('');
    const [images, setImages] = useState<Record<string, string>>({});

    useEffect(() => {
        const loadEpub = async () => {
            if (bookFile) {
                try {
                    const zip = await JSZip.loadAsync(bookFile);

                    // Извлечение OPF файла
                    const opfFileEntry = zip.file(/.*\.opf$/i)[0];
                    if (opfFileEntry) {
                        const opfFile = await opfFileEntry.async('string');
                        const parser = new DOMParser();
                        const opfDoc = parser.parseFromString(opfFile, 'application/xml');

                        console.log('Parsed OPF Document:', opfDoc);
                        console.log('OPF File Content:', opfFile); // Log the OPF file content for inspection

                        // Извлечение всех CSS файлов
                        const cssFiles = Array.from(zip.file(/.*\.css$/i));
                        const cssContents = await Promise.all(cssFiles.map(file => file.async('string')));
                        setCssContent(cssContents.join('\n'));

                        // Извлечение всех изображений
                        const imageFiles = Array.from(zip.file(/\.(png|jpg|jpeg|gif|svg)$/i));
                        const imageMap: Record<string, string> = {};

                        await Promise.all(imageFiles.map(async (file) => {
                            const data = await file.async('base64');
                            const extensionMatch = file.name.match(/\.(png|jpg|jpeg|gif|svg)$/i);
                            const extension = extensionMatch ? extensionMatch[1].toLowerCase() : 'png';
                            const mimeType = extension === 'svg' ? 'image/svg+xml' : `image/${extension === 'jpg' ? 'jpeg' : extension}`;
                            const dataUri = `data:${mimeType};base64,${data}`;
                            imageMap[file.name] = dataUri;
                        }));

                        setImages(imageMap);

                        // Извлечение XHTML файлов как глав
                        const chapterFiles = Array.from(zip.file(/.*\.x?html$/i)); // Поддержка .html и .xhtml
                        const newChapters: Chapter[] = chapterFiles.map((file) => ({
                            label: file.name.replace(/.*\/([^\/]+)$/, '$1'), // Извлечение имени файла без пути
                            href: file.name,
                            cfi: '', // CFI can be computed later
                            level: 1, // Adjust based on your structure
                        }));

                        console.log('Extracted Chapters:', newChapters);
                        setChapters(newChapters);
                        setCurrentChapter(newChapters[0]?.href || null); // Set the first chapter as default if available
                    } else {
                        console.error('No OPF file found in the ePub.');
                    }
                } catch (err) {
                    console.error('Error loading EPUB:', err);
                }
            }
        };

        loadEpub();
    }, [bookFile]);

    useEffect(() => {
        const loadChapterContent = async (href: string) => {
            if (href && bookFile) {
                try {
                    const zip = await JSZip.loadAsync(bookFile);

                    // Проверка существования файла главы
                    const chapterFile = zip.file(href);
                    if (chapterFile) {
                        let contentFile = await chapterFile.async('string');
                        console.log('Chapter Content:', contentFile);

                        // 1. Удаляем декларацию XML
                        contentFile = contentFile.replace(/<\?xml.*?\?>\s*/g, '');

                        // 2. Парсим содержимое и извлекаем содержимое <body>
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(contentFile, 'application/xhtml+xml');
                        const body = doc.body;

                        if (body) {
                            // 3. Обрабатываем изображения внутри <img> и <image> тегов
                            const imagesInContent = body.querySelectorAll('img, image');

                            imagesInContent.forEach((imgElement) => {
                                if (imgElement.tagName.toLowerCase() === 'img') {
                                    const src = imgElement.getAttribute('src');
                                    if (src) {
                                        const imagePath = getFullImagePath(href, src);
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
                                        const imagePath = getFullImagePath(href, hrefAttr);
                                        const imageUri = images[imagePath] || images[hrefAttr];
                                        if (imageUri) {
                                            imgElement.setAttributeNS('http://www.w3.org/1999/xlink', 'href', imageUri);
                                        } else {
                                            console.warn(`Изображение не найдено: ${hrefAttr}`);
                                        }
                                    }
                                }
                            });

                            // 4. Сериализуем обновлённый HTML
                            const serializer = new XMLSerializer();
                            let bodyContent = serializer.serializeToString(body);

                            // Опционально: Санитизация HTML для безопасности
                            bodyContent = DOMPurify.sanitize(bodyContent);

                            setContent(bodyContent);
                        } else {
                            console.error('No body tag found in chapter content.');
                        }
                    } else {
                        console.error(`Chapter file not found: ${href}`);
                    }
                } catch (err) {
                    console.error('Error loading chapter content:', err);
                }
            }
        };

        if (currentChapter) {
            loadChapterContent(currentChapter);
        }
    }, [currentChapter, bookFile, images]);

    /**
     * Функция для получения полного пути к изображению на основе пути главы и относительного пути к изображению.
     * @param chapterHref Полный путь к файлу главы.
     * @param src Относительный путь к изображению внутри главы.
     * @returns Полный путь к изображению.
     */
    const getFullImagePath = (chapterHref: string, src: string): string => {
        if (src.startsWith('/')) {
            // Абсолютный путь относительно корня EPUB
            return src.substring(1);
        } else {
            // Относительный путь относительно директории главы
            const chapterPath = chapterHref.substring(0, chapterHref.lastIndexOf('/') + 1);
            return chapterPath + src;
        }
    };

    if (isLoadingContent) {
        return <Loader2 />;
    }

    if (error) {
        return <div>Error loading book: {error.message}</div>;
    }

    console.log(content);

    if (!content) {
        return <div>Error content</div>;
    }

    return (
        <div className="book-reader">
            {/* Внедрение CSS-стилей */}
            {cssContent && (
                <style>
                    {cssContent}
                </style>
            )}
            <ScrollArea>
                <nav>
                    {chapters.map((chapter, index) => (
                        <Button key={index} onClick={() => setCurrentChapter(chapter.href)}>
                            {chapter.label}
                        </Button>
                    ))}
                </nav>
                <div className="chapter-content">
                    {htmlReactParser(content)}
                </div>
            </ScrollArea>
        </div>
    );
};

export default BookReader;
