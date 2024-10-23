import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useGetBookByIdQuery } from '../model/booksApiSlice';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

import { ChaptersPopup } from './ChaptersPopup';
import useChapter from '../hooks/useChapter';
import useEPUB from '../hooks/useEPUB';
import PagedText from './PagedText';
import { flattenChapters, getParentChapters } from '../model/utils';
import useChapterDuplicate from '../hooks/useChapterDuplicate';

const extractChapterTitles = (chapters) => {
    const titles = [];

    const extractTitlesRecursively = (chapterList) => {
        chapterList.forEach((chapter) => {
            titles.push(chapter.label); // Добавляем заголовок текущего уровня
            if (chapter.children && chapter.children.length > 0) {
                extractTitlesRecursively(chapter.children); // Рекурсивно обрабатываем дочерние элементы
            }
        });
    };

    extractTitlesRecursively(chapters);

    return titles;
};

const BookReader: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [currentChapter, setCurrentChapter] = useState<string>(null);
    const [isScrollingInPopup, setIsScrollingInPopup] = useState(false);

    const { data: bookFile, isLoading: isLoadingContent, error } = useGetBookByIdQuery(id);
    const { chapters, cssContent, images } = useEPUB(bookFile);

    useEffect(() => {
        if (chapters.length > 0 && !currentChapter) {
            setCurrentChapter(chapters[0].href);
        }
    }, [chapters, currentChapter]);

    const knownChapterTitles = extractChapterTitles(chapters);

    const { content, headings } = useChapter({
        bookFile,
        href: currentChapter,
        images,
        knownChapterTitles, // Pass known chapter titles
    });
    console.log(content);
    

    // Function to handle heading encountered
    const handleHeadingEncountered = (chapterTitle: string) => {
        const flatChapters = flattenChapters(chapters);
        const chapter = flatChapters.find((ch) => ch.label === chapterTitle);
        if (chapter && chapter.href !== currentChapter) {
            setCurrentChapter(chapter.href);
        }
    };

    //! Используем хук для поиска дублирующихся глав
    const {
        duplicates,
        loading: isLoadingDuplicates,
        error: duplicatesError,
    } = useChapterDuplicate({
        bookFile,
        chapters,
    });

    //! настройка скролла для popup оглавления
    const handleWheel = (event: WheelEvent) => {
        if (!isScrollingInPopup) {
            if (event.deltaY < 0) {
            } else if (event.deltaY > 0) {
            }
        }
    };

    useEffect(() => {
        window.addEventListener('wheel', handleWheel);

        return () => {
            window.removeEventListener('wheel', handleWheel);
        };
    }, [isScrollingInPopup]);

    //!логика переключения глав

    // Логика переключения глав с учётом вложенности
    const handleNext = () => {
        const flatChapters = flattenChapters(chapters); // Все главы в одном массиве
        const currentChapterIndex = flatChapters.findIndex((ch) => ch.href === currentChapter);

        if (currentChapterIndex !== -1 && currentChapterIndex < flatChapters.length - 1) {
            setCurrentChapter(flatChapters[currentChapterIndex + 1].href);
        }
    };

    const handlePrev = () => {
        const flatChapters = flattenChapters(chapters); // Все главы в одном массиве
        const currentChapterIndex = flatChapters.findIndex((ch) => ch.href === currentChapter);

        if (currentChapterIndex > 0) {
            setCurrentChapter(flatChapters[currentChapterIndex - 1].href);
        }
    };

    const parentChapters = getParentChapters(chapters, currentChapter || '');

    if (isLoadingContent) {
        return <Loader2 />;
    }

    if (error) {
        return <div>Error loading book: {error?.message}</div>;
    }

    return (
        <div className="book-reader" style={{ position: 'relative' }}>
            {/* Внедрение CSS-стилей */}
            {cssContent && <style>{cssContent} </style>}

            {/* Всплывающее окно с оглавлением */}
            <ChaptersPopup
                mockChapters={chapters}
                currentChapter={currentChapter}
                setCurrentChapter={setCurrentChapter}
                setIsScrollingInPopup={setIsScrollingInPopup} // Передаем управление скроллом
            />

            <div className="page-navigation flex justify-center mb-2 relative">
                <button onClick={handlePrev} disabled={!currentChapter} className="nav-button absolute top-7 right-[50%]">
                    <ArrowLeft />
                </button>
                {/* Отображение текущей главы */}
                <div className="current-chapter-title text-[12px] font-bold" style={{ margin: '0 20px', textAlign: 'center' }}>
                    {parentChapters.map((chapter, index) => (
                        <span key={index}>
                            {chapter.label} {index < parentChapters.length - 1 ? ' » ' : ''} {chapter.href}
                        </span>
                    ))}
                </div>
                <button onClick={handleNext} disabled={!currentChapter} className="nav-button absolute top-7 left-[50%]">
                    <ArrowRight />
                </button>
            </div>

            {/* Основное содержимое книги */}
            <PagedText
                text={content}
                onHeadingEncountered={handleHeadingEncountered} // Pass the handler
            />
        </div>
    );
};

export default BookReader;
