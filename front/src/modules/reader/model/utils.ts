import ePub, { Book } from 'epubjs';
import { Chapter, ChapterPart } from './types';
import Spine from 'epubjs/types/spine';

export const processBook = async (book: Book, limit: number): Promise<Chapter[]> => {
    await book.ready;

    const spine = book.spine as Spine & { items: any[] };
    const newChapters: Chapter[] = [];


    
    for (const item of spine.items) {
        const doc = (await book.load(item.href)) as Document;
        console.log(doc);
        
        const chapterText = doc.body?.textContent || '';
        const chapterTitle = extractChapterTitle(doc) || item.label || 'Без названия';

        if (chapterText.length > limit) {
            const parts: ChapterPart[] = [];
            for (let i = 0; i < chapterText.length; i += limit) {
                const partContent = chapterText.slice(i, i + limit);
                parts.push({
                    title: `Часть ${Math.floor(i / limit) + 1}`,
                    content: partContent,
                    charCount: partContent.length,
                });
            }


            newChapters.push({
                title: chapterTitle,
                parts,
                charCount: chapterText.length,
            });
        } else {
            newChapters.push({
                title: chapterTitle,
                content: chapterText,
                charCount: chapterText.length,
            });
        }
    }

    return newChapters;
};

export const saveBookToLocalStorage = (book: Book, chapters: Chapter[]) => {
    // Сохраняем основную информацию о книге
    localStorage.setItem(
        'bookMetadata',
        JSON.stringify({
            url: book.url,
            key: book.key,
            packaging: book.packaging,
        })
    );

    // Сохраняем главы
    localStorage.setItem('bookChapters', JSON.stringify(chapters));
};

// Функция для загрузки книги из localStorage
export const loadBookFromLocalStorage = async (): Promise<{ book: Book | null; chapters: Chapter[] }> => {
    const bookMetadataString = localStorage.getItem('bookMetadata');
    const chaptersString = localStorage.getItem('bookChapters');

    if (!bookMetadataString || !chaptersString) {
        return { book: null, chapters: [] };
    }

    const bookMetadata = JSON.parse(bookMetadataString);
    const chapters = JSON.parse(chaptersString) as Chapter[];

    // Создаем новый экземпляр Book с сохраненными метаданными
    const book = ePub(bookMetadata.url);
    book.key = bookMetadata.key;
    book.packaging = bookMetadata.packaging;

    console.log('Book loaded from localStorage');
    return { book, chapters };
};

export const extractChapterTitle = (doc: Document): string => {
    const headingElements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headingElements.length > 0) {
        return headingElements[0].textContent?.trim() || 'Без названия';
    }

    const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
        const text = node.textContent?.trim();
        if (text) {
            return text;
            // return text.substring(0, 50) + (text.length > 50 ? '...' : '');
        }
    }

    return 'Без названия';
};

export const formatCharCount = (count: number): string => {
    return count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};
