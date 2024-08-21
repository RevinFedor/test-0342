import React, { useState, useEffect, useRef } from 'react';

const EBookReader = ({ content }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [pages, setPages] = useState([]);
    const containerRef = useRef(null);



    useEffect(() => {
        const splitContentIntoPages = () => {
            if (!containerRef.current) return;

            const container = containerRef.current;
            const containerHeight = container.clientHeight;
            const lineHeight = parseInt(window.getComputedStyle(container).lineHeight);
            const charsPerLine = Math.floor(container.clientWidth / 10); // Примерное количество символов в строке
            const linesPerPage = Math.floor(containerHeight / lineHeight) * 2; // Умножаем на 2 для двух колонок
            const charsPerPage = charsPerLine * linesPerPage;

            const newPages = [];
            for (let i = 0; i < content.length; i += charsPerPage) {
                newPages.push(content.slice(i, i + charsPerPage));
            }
            setPages(newPages);
        };

        splitContentIntoPages();
        window.addEventListener('resize', splitContentIntoPages);

        return () => {
            window.removeEventListener('resize', splitContentIntoPages);
        };
    }, [content]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') {
                setCurrentPage((prev) => Math.max(0, prev - 1));
            } else if (e.key === 'ArrowRight') {
                setCurrentPage((prev) => Math.min(pages.length - 1, prev + 1));
            }
        };

        const handleWheel = (e) => {
            if (e.deltaY < 0) {
                setCurrentPage((prev) => Math.max(0, prev - 1));
            } else if (e.deltaY > 0) {
                setCurrentPage((prev) => Math.min(pages.length - 1, prev + 1));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('wheel', handleWheel);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('wheel', handleWheel);
        };
    }, [pages.length]);

    return (
        <div className="flex flex-col h-screen h-[750px]">
            <div className="flex justify-center items-center p-2">
                <span>
                    Страница {currentPage + 1} из {pages.length}
                </span>
            </div>
            <div ref={containerRef} className="flex-grow overflow-hidden p-4">
                <div className="columns-2 gap-8 text-justify h-full" dangerouslySetInnerHTML={{ __html: pages[currentPage] }} />
            </div>
        </div>
    );
};

export default EBookReader;
