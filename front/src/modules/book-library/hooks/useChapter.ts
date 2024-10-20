// src/features/bookReader/hooks/useChapter.ts
import { useState, useEffect } from 'react';
import JSZip from 'jszip';
import DOMPurify from 'dompurify';
import { getFullImagePath } from '../model/epubUtils';

interface UseChapterProps {
    bookFile: Blob;
    href: string;
    images: Record<string, string>;
}

//! Загрузка содержимого текущей главы
const useChapter = ({ bookFile, href, images }: UseChapterProps) => {
    const [content, setContent] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadChapter = async () => {
            try {
                const zip = await JSZip.loadAsync(bookFile);
                const baseHref = href.split('#')[0];
                let chapterFile = zip.file(`OPS/${baseHref}`);
                if (!chapterFile) {
                    const availableFiles = Object.keys(zip.files);
                    const similarFile = availableFiles.find((file) => file.toLowerCase() === baseHref.toLowerCase());
                    if (similarFile) {
                        chapterFile = zip.file(similarFile);
                        console.warn(`Найден файл с похожим именем: ${similarFile}`);
                    } else {
                        throw new Error(`Файл главы не найден: ${baseHref}`);
                    }
                }

                let contentFile = await chapterFile.async('string');
                contentFile = contentFile.replace(/<\?xml.*?\?>\s*/g, '');

                const parser = new DOMParser();
                const doc = parser.parseFromString(contentFile, 'application/xhtml+xml');
                const body = doc.body;

                if (body) {
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

                    const serializer = new XMLSerializer();
                    let bodyContent = serializer.serializeToString(body);
                    bodyContent = DOMPurify.sanitize(bodyContent);
                    setContent(bodyContent);
                } else {
                    throw new Error('Тег <body> не найден в содержимом главы.');
                }
            } catch (err) {
                console.error('Ошибка при загрузке содержимого главы:', err);
                setError(err.message);
            }
        };

        loadChapter();
    }, [href, bookFile, images]);

    return { content, error };
};

export default useChapter;
