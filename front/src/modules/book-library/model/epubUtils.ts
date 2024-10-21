// src/shared/utils/epubUtils.ts
import { Chapter } from '../model/types';

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
    if (src.startsWith('/')) {
        return src.substring(1);
    } else {
        const chapterPath = baseHref.substring(0, baseHref.lastIndexOf('/') + 1);
        return chapterPath + src;
    }
};



//! Функция для рекурсивного извлечения всех глав, включая вложенные
export const flattenChapters = (chapters: Chapter[]): Chapter[] => {
    let flatChapters: Chapter[] = [];

    const traverse = (chapterList: Chapter[]) => {
        chapterList.forEach((chapter) => {
            flatChapters.push(chapter);
            if (chapter?.children && chapter.children.length > 0) {
                traverse(chapter.children);
            }
        });
    };

    traverse(chapters);
    return flatChapters;
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
