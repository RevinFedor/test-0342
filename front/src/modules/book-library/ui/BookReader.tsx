import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGetBookByIdQuery } from '../model/booksApiSlice';
import { Loader2 } from 'lucide-react';
import htmlReactParser from 'html-react-parser';

import { ChaptersPopup } from './ChaptersPopup';
import useChapter from '../hooks/useChapter';
import useEPUB from '../hooks/useEPUB';
import PagedText from './PagedText';


    

const BookReader: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [currentChapter, setCurrentChapter] = useState<string | null>(null);

    const { data: bookFile, isLoading: isLoadingContent, error } = useGetBookByIdQuery(id);
    const { chapters, cssContent, images, error: epubError } = useEPUB(bookFile);

    // Установить первую главу после загрузки оглавления
    useEffect(() => {
        if (chapters.length > 0 && !currentChapter) {
            setCurrentChapter(chapters[0].href);
        }
    }, [chapters, currentChapter]);

    const { content } = useChapter({
        bookFile,
        href: currentChapter,
        images,
    });

    if (isLoadingContent) {
        return <Loader2 />;
    }

    if (error) {
        return <div>Error loading book: {error?.message}</div>;
    }

    return (
        <div className="book-reader" style={{ position: 'relative' }}>
            {/* Внедрение CSS-стилей */}
            {cssContent && <style>{cssContent}</style>}

            {/* Всплывающее окно с оглавлением */}
            <ChaptersPopup mockChapters={chapters} currentChapter={currentChapter} setCurrentChapter={setCurrentChapter} />

            {/* Основное содержимое книги */}
            {/* <div className="chapter-content">{content ? htmlReactParser(content) : <div>Выберите главу для чтения.</div>}</div> */}

            <PagedText text={content} />
        </div>
    );
};

export default BookReader;
