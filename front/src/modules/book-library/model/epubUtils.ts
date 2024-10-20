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
