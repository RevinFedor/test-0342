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
    const [knownChapterTitles, setKnownChapterTitles] = useState<string[]>([]); // State to store chapter titles
    const [initialPage, setInitialPage] = useState<number>(0); // New state for initial page

    const { data: bookFile, isLoading: isLoadingQuery, error } = useGetBookByIdQuery(id);
    const { chapters, cssContent, images } = useEPUB(bookFile);

    useEffect(() => {
        if (chapters.length > 0 && !currentChapter) {
            setCurrentChapter(chapters[0].href);
        }
    }, [chapters, currentChapter]);

    //! Call extractChapterTitles only once on initial load
    useEffect(() => {
        if (chapters.length > 0) {
            setKnownChapterTitles(extractChapterTitles(chapters)); // Set titles once
        }
    }, [chapters]); // Empty dependency array ensures this runs only once

    //! Используем хук для поиска дублирующихся глав
    const {
        duplicates,
        loading: isLoadingDuplicates,
        error: duplicatesError,
    } = useChapterDuplicate({
        bookFile,
        chapters,
    });

    const { content, isLoading: isLoadingUseChapter } = useChapter({
        bookFile,
        href: currentChapter,
        images,
        knownChapterTitles, // Pass known chapter titles
        duplicates,
    });

    // Function to handle heading encountered
    const handleHeadingEncountered = (chapterTitle: string) => {
        const flatChapters = flattenChapters(chapters);
        const chapter = flatChapters.find((ch) => ch.label === chapterTitle);
        if (chapter && chapter.href !== currentChapter) {
            setCurrentChapter(chapter.href);
        }
    };

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

    const handleNextChapter = () => {
        const flatChapters = flattenChapters(chapters);
        const currentChapterIndex = flatChapters.findIndex((ch) => ch.href === currentChapter);

        if (currentChapterIndex !== -1 && currentChapterIndex < flatChapters.length - 1) {
            setInitialPage(0); // Start at first page for the next chapter
            setCurrentChapter(flatChapters[currentChapterIndex + 1].href);
        }
    };

    const handlePrevChapter = () => {
        const flatChapters = flattenChapters(chapters);
        const currentChapterIndex = flatChapters.findIndex((ch) => ch.href === currentChapter);

        if (currentChapterIndex > 0) {
            setInitialPage(-1); // Indicate to start at the last page
            setCurrentChapter(flatChapters[currentChapterIndex - 1].href);
        }
    };

    const parentChapters = getParentChapters(chapters, currentChapter || '');

    if (isLoadingQuery) {
        return <Loader2 />;
    }

    if (error) {
        return <div>Error loading book: {error?.message}</div>;
    }

    console.log('content-----------------------');

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

            {/* Отображение текущей главы */}
            <div className="current-chapter-title text-[12px] font-bold" style={{ margin: '0 20px', textAlign: 'center' }}>
                {parentChapters.map((chapter, index) => (
                    <span key={index}>
                        {chapter.label} {index < parentChapters.length - 1 ? ' » ' : ''}
                    </span>
                ))}
            </div>

            {/* Основное содержимое книги */}
            <PagedText
                text={content}
                onHeadingEncountered={handleHeadingEncountered}
                onNextChapter={handleNextChapter} // Add this prop
                onPrevChapter={handlePrevChapter} // Add this prop
                initialPage={initialPage} // Pass the initialPage prop
                isLoadingUseChapter={isLoadingUseChapter}
            />
        </div>
    );
};

export default BookReader;
