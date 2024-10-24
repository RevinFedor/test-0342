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
//!PagetText________________________

//! функция для обработки изображений заранее
export const waitForImages = (container: HTMLElement): Promise<void> => {
    const images = container.querySelectorAll('img');
    const promises = Array.from(images).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
        });
    });
    return Promise.all(promises).then(() => {});
};

//! Рекурсивная функция для сбора всех элементов
export const collectElements = (node: Node, elements: HTMLElement[]) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        // Собираем все блочные элементы
        if (['P', 'H1', 'H2', 'H3', 'IMG', 'DIV', 'FIGURE', 'SECTION', 'ARTICLE'].includes(el.tagName)) {
            elements.push(el);
            // Не рекурсивно обходим детей, если это блочный элемент
            return;
        }
        // Рекурсивно обходим детей для других типов элементов
        el.childNodes.forEach((child) => collectElements(child, elements));
    }
    // Игнорируем текстовые узлы и другие типы узлов
};

//! Функция для оценки высоты элемента
export const estimateElementHeight = (el: HTMLElement): number => {
    // Создаём временный контейнер для измерения
    const tempContainer = document.createElement('div');
    tempContainer.style.visibility = 'hidden';
    tempContainer.style.position = 'absolute';
    tempContainer.style.top = '0';
    tempContainer.style.left = '0';
    tempContainer.style.width = '780px'; //! Убедитесь, что это соответствует реальной ширине столбца


    // Клонируем элемент для измерения
    const clone = el.cloneNode(true) as HTMLElement;

    // Для изображений задаём фиксированные размеры или получаем реальные
    if (clone.tagName === 'IMG') {
        const img = clone as HTMLImageElement;
        if (!img.height || img.height === 0) {
            // Задаём стандартную высоту, если не задана
            img.style.height = '200px';
        }
        // Устанавливаем ширину, чтобы соответствовать колонке
        img.style.width = '100%';
        img.style.objectFit = 'contain';
        img.style.display = 'block'; // Чтобы убрать пробелы снизу
    }

    tempContainer.appendChild(clone);
    document.body.appendChild(tempContainer);
    const height = tempContainer.offsetHeight;
    document.body.removeChild(tempContainer);
    return height;
};

//! Функция для распределения текста по страцниам
export async function splitHtmlIntoPages(
    html: string,
    maxHeight: number,
   
): Promise<{ pages: Page[]; pageHeadings: Record<number, string> }> {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    await waitForImages(tempDiv); // complite full html

    const allElements: HTMLElement[] = [];
    tempDiv.childNodes.forEach((child) => collectElements(child, allElements)); // every element

    const pagesArray: Page[] = [];

    const pageHeadings: Record<number, string> = {};

    let currentPageContent: Page = { left: '', right: '' };

    let currentColumnHeight = [0, 0]; // [leftHeight, rightHeight]

    let currentColumn = 0; // 0 - left, 1 - right

    let currentPageIndex = 0;

    for (const element of allElements) {
        const elHeight = estimateElementHeight(element);

        if (elHeight > maxHeight) {
            console.warn(`Element <${element.tagName.toLowerCase()}> exceeds max height and will be skipped.`);
            continue;
        }

        if (currentColumnHeight[currentColumn] + elHeight > maxHeight) {
            if (currentColumn === 0 && currentColumnHeight[1] === 0) {
                currentColumn = 1;
            } else {
                pagesArray.push(currentPageContent);

                currentPageContent = { left: '', right: '' };

                currentColumnHeight = [0, 0];

                currentColumn = 0;

                currentPageIndex++;
            }
        }

        // Check for data-chapter-title attribute
        if (element.hasAttribute('data-chapter-title')) {
            const chapterTitle = element.getAttribute('data-chapter-title');
            console.log(`Found heading on page ${currentPageIndex}: ${chapterTitle}`);
            if (!pageHeadings[currentPageIndex]) {
                pageHeadings[currentPageIndex] = chapterTitle!;
            }
        } else {
            console.log('Attribute not Found');
        }

        // Add element to current column
        const htmlString = element.outerHTML || element.innerHTML || '';
        currentPageContent[currentColumn === 0 ? 'left' : 'right'] += htmlString;
        currentColumnHeight[currentColumn] += elHeight;
    }

    // Add the last page
    if (currentPageContent.left || currentPageContent.right) {
        pagesArray.push(currentPageContent);
    }

    return { pages: pagesArray, pageHeadings };
}

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
