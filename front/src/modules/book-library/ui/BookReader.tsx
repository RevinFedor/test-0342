// ui/BookReader.tsx

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGetBookByIdQuery } from '../model/booksApiSlice';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

import { ChaptersPopup } from './ChaptersPopup';
import useChapter from '../hooks/useChapter';
import useEPUB from '../hooks/useEPUB';
import PagedText from './PagedText';
import { flattenChapters, getParentChapters } from '../model/utils';
import useChapterDuplicate from '../hooks/useChapterDuplicate';

const BookReader: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [currentChapter, setCurrentChapter] = useState<string>(null);
    const [isScrollingInPopup, setIsScrollingInPopup] = useState(false); // Отслеживаем скролл в popup

    const { data: bookFile, isLoading: isLoadingContent, error } = useGetBookByIdQuery(id);
    const { chapters, cssContent, images } = useEPUB(bookFile);

    useEffect(() => {
        if (chapters.length > 0 && !currentChapter) {
            setCurrentChapter(chapters[0].href);
        }
    }, [chapters, currentChapter]);

    const { content, error: chapterError } = useChapter({
        bookFile,
        href: currentChapter,
        images,
    });

    //! Используем хук для поиска дублирующихся глав
    const {
        duplicates,
        loading: isLoadingDuplicates,
        error: duplicatesError,
    } = useChapterDuplicate({
        bookFile,
        chapters,
    });



    //! Обработка событий колесика для popup оглавления
    const handleWheel = (event: WheelEvent) => {
        if (!isScrollingInPopup) {
            if (event.deltaY < 0) {
                // Обработка прокрутки вверх, если нужно
            } else if (event.deltaY > 0) {
                // Обработка прокрутки вниз, если нужно
            }
        }
    };

    useEffect(() => {
        window.addEventListener('wheel', handleWheel);

        return () => {
            window.removeEventListener('wheel', handleWheel);
        };
    }, [isScrollingInPopup]);

    //! Логика переключения глав

    // Функция для перехода на следующую главу
    const handleNext = () => {
        const flatChapters = flattenChapters(chapters); // Плоский список всех глав
        const currentChapterIndex = flatChapters.findIndex((ch) => ch.href === currentChapter);

        if (currentChapterIndex !== -1 && currentChapterIndex < flatChapters.length - 1) {
            setCurrentChapter(flatChapters[currentChapterIndex + 1].href);
        }
    };

    // Функция для перехода на предыдущую главу
    const handlePrev = () => {
        const flatChapters = flattenChapters(chapters); // Плоский список всех глав
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

    if (chapterError) {
        return <div>Error loading chapter: {chapterError}</div>;
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
                setIsScrollingInPopup={setIsScrollingInPopup} // Передаём состояние скролла
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
                onNextChapter={handleNext}
                onPrevChapter={handlePrev}
            />
        </div>
    );
};

export default BookReader;
