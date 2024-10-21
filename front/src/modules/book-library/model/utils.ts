// src/shared/utils/epubUtils.ts
import JSZip from 'jszip';
import { Chapter } from './types';
import DOMPurify from 'dompurify';

export const parseNavPoints = (navPoints: NodeListOf<Element>, currentLevel: number = 1): Chapter[] => {
    const chapters: Chapter[] = [];

    navPoints.forEach((navPoint) => {
        const label = navPoint.querySelector('navLabel > text')?.textContent || 'Глава';
        const href = navPoint.querySelector('content')?.getAttribute('src') || '';

        const chapter: Chapter = {
            label,
            href,
            cfi: '',
            level: currentLevel,
            children: [],
        };

        const childNavPoints = navPoint.querySelectorAll(':scope > navPoint');
        if (childNavPoints.length > 0) {
            chapter.children = parseNavPoints(childNavPoints, currentLevel + 1);
        }

        chapters.push(chapter);
    });

    return chapters;
};

export const getFullImagePath = (baseHref: string, src: string): string => {
    // If the src is already an absolute path like 'OPS/images/...'
    if (src.startsWith('OPS/')) {
        return src;
    }

    // If the src is relative, ensure that 'OPS/' is prepended if it's missing
    const chapterPath = baseHref.substring(0, baseHref.lastIndexOf('/') + 1);
    const fullPath = chapterPath + src;

    if (!fullPath.startsWith('OPS/')) {
        return 'OPS/' + fullPath;
    }

    return fullPath;
};

/**
 * Хелпер-функция для разворачивания иерархии глав.
 * @param chapters - список глав
 * @returns плоский список глав
 */
export const flattenChapters = (chapters: Chapter[]): Chapter[] => {
    const flat: Chapter[] = [];
    const traverse = (chapterList: Chapter[]) => {
        chapterList.forEach((chapter) => {
            flat.push(chapter);
            if (chapter.children && chapter.children.length > 0) {
                traverse(chapter.children);
            }
        });
    };
    traverse(chapters);
    return flat;
};

//! Функция для получения всех родительских глав до третьего или четвертого уровня
export const getParentChapters = (chapters: Chapter[], href: string): Chapter[] => {
    const parents: Chapter[] = [];

    const findChapter = (chapterList: Chapter[], currentHref: string, ancestors: Chapter[] = []): boolean => {
        for (const chapter of chapterList) {
            const newAncestors = [...ancestors, chapter];
            if (chapter.href === currentHref) {
                // Добавляем найденных родителей
                parents.push(...newAncestors);
                return true;
            }

            // Если у главы есть вложенные, ищем в них
            if (chapter.children && chapter.children.length > 0) {
                const found = findChapter(chapter.children, currentHref, newAncestors);
                if (found) {
                    return true;
                }
            }
        }
        return false;
    };

    findChapter(chapters, href);
    return parents;
};

//! ++++++++++++++++++++++
/**
 * Получает базовый href, удаляя фрагмент.
 * @param href - полный href с фрагментом
 * @returns базовый href без фрагмента
 */
export const getBaseHref = (href: string): string => {
    const [baseHref] = href.split('#');
    return baseHref;
};

/**
 * Загружает содержимое главы по href.
 * @param bookFile - EPUB файл как ArrayBuffer
 * @param href - href главы
 * @returns содержимое главы как строка или null в случае ошибки
 */
export const loadChapterContent = async (bookFile: ArrayBuffer, href: string): Promise<string | null> => {
    try {
        const zip = await JSZip.loadAsync(bookFile);
        const baseHref = getBaseHref(href);
        let chapterFile = zip.file(`OPS/${baseHref}`);

        if (!chapterFile) {
            const availableFiles = Object.keys(zip.files);
            const similarFile = availableFiles.find((file) => file.toLowerCase() === baseHref.toLowerCase());
            if (similarFile) {
                chapterFile = zip.file(similarFile);
            } else {
                return null;
            }
        }

        let chapterContent = await chapterFile.async('string');
        // Удаляем XML декларацию, если она есть
        chapterContent = chapterContent.replace(/<\?xml.*?\?>\s*/g, '');

        // Очищаем содержимое с помощью DOMPurify
        const parser = new DOMParser();
        const doc = parser.parseFromString(chapterContent, 'application/xhtml+xml');
        const body = doc.body;

        if (!body) {
            console.warn('Тег <body> не найден в содержимом главы.');
            return null;
        }

        // Сериализуем содержимое <body>
        const serializer = new XMLSerializer();
        let sanitizedContent = serializer.serializeToString(body);
        sanitizedContent = DOMPurify.sanitize(sanitizedContent);
        return sanitizedContent;
    } catch (err) {
        console.error('Ошибка при загрузке содержимого главы:', err);
        return null;
    }
};

/**
 * Вычисляет SHA-256 хеш для заданной строки.
 * @param content - содержимое главы
 * @returns хеш в формате hex
 */
export const computeHash = async (content: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
};



