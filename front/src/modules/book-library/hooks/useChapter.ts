// src/features/bookReader/hooks/useChapter.ts
import { useState, useEffect } from 'react';
import JSZip from 'jszip';
import DOMPurify from 'dompurify';
import { getFullImagePath } from '../model/utils';

interface UseChapterProps {
    bookFile: ArrayBuffer | null; // Changed from Blob to ArrayBuffer
    href: string;
    images: Record<string, string>;
}

const useChapter = ({ bookFile, href, images }: UseChapterProps) => {
    const [content, setContent] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!bookFile) {
            return;
        }
        const loadChapter = async () => {
            try {
                console.log('Loading chapter with href:', href);
                const zip = await JSZip.loadAsync(bookFile);
                const baseHref = href.split('#')[0];
                let chapterFile = zip.file(`OPS/${baseHref}`);
                if (!chapterFile) {
                    const availableFiles = Object.keys(zip.files);
                    const similarFile = availableFiles.find((file) => file.toLowerCase() === baseHref.toLowerCase());
                    if (similarFile) {
                        chapterFile = zip.file(similarFile);
                        console.warn(`Found a similar file name: ${similarFile}`);
                    } else {
                        throw new Error(`Chapter file not found: ${baseHref}`);
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
                        const src = imgElement.getAttribute('src') || imgElement.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
                        if (src) {
                            const imagePath = getFullImagePath(baseHref, src);
                            const imageUri = images[imagePath] || images[src];

                            // Проверяем, является ли элемент HTML-картинкой (<img>) или SVG-картинкой (<image>),
                            // и устанавливаем правильный атрибут для источника изображения (src для HTML и href для SVG).
                            if (imageUri) {
                                if (imgElement instanceof HTMLImageElement || imgElement instanceof SVGImageElement) {
                                    if (imgElement instanceof HTMLImageElement) {
                                        imgElement.setAttribute('src', imageUri);
                                    } else {
                                        imgElement.setAttributeNS('http://www.w3.org/1999/xlink', 'href', imageUri);
                                    }

                                    imgElement.style.display = 'block';
                                    imgElement.style.marginLeft = 'auto';
                                    imgElement.style.marginRight = 'auto';
                                    imgElement.style.maxWidth = '100%';
                                    imgElement.style.height = 'auto';
                                }
                            } else {
                                console.warn(`Image not found: ${src}`);
                            }
                        }
                    });

                    const serializer = new XMLSerializer();
                    let bodyContent = serializer.serializeToString(body);
                    bodyContent = DOMPurify.sanitize(bodyContent);
                    setContent(bodyContent);
                } else {
                    throw new Error('The <body> tag was not found in the chapter content.');
                }
            } catch (err: any) {
                console.error('Error loading chapter content:', err);
                setError(err.message);
            }
        };

        if (bookFile && href) {
            loadChapter();
        }
    }, [href, bookFile, images]);

    return { content, error };
};

export default useChapter;
