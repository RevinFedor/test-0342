import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/ui/components/ui/button';
import parse from 'html-react-parser';
import { splitHtmlIntoPages } from '../model/utils';

interface PagedTextProps {
    text?: string;
    maxColumnHeight?: number;
    onHeadingEncountered: (heading: string) => void;
    onNextChapter: () => void;
    onPrevChapter: () => void;
    initialPage?: number;
    isLoadingUseChapter?: boolean;
}

interface Page {
    left: string;
    right: string;
}

export default function PagedText({
    text = '',
    maxColumnHeight = 700,
    onHeadingEncountered,
    onNextChapter,
    onPrevChapter,
    initialPage = 0,
    isLoadingUseChapter,
}: PagedTextProps) {
    const [pages, setPages] = useState<Page[]>([]);
    const [pageHeadings, setPageHeadings] = useState<Record<number, string>>({});
    const [currentPage, setCurrentPage] = useState(0);
    const isSplittingRef = useRef(false); // Prevent duplicate splitting

    // Для управления выделением и отображением кнопки
    const [selection, setSelection] = useState<{
        text: string;
        range: Range | null;
        rect: DOMRect | null;
    }>({ text: '', range: null, rect: null });
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        console.log('useEffect: Splitting HTML into pages');
        if (!text) {
            console.log('No text provided. Setting pages to empty array.');
            setPages([]);
            return;
        }

        if (isSplittingRef.current) {
            console.log('Already splitting. Exiting useEffect.');
            return;
        }
        isSplittingRef.current = true;

        splitHtmlIntoPages(text, maxColumnHeight)
            .then(({ pages: pagesResult, pageHeadings: headingsResult }) => {
                console.log('splitHtmlIntoPages: Success');
                setPages(pagesResult);
                setPageHeadings(headingsResult);
                if (initialPage === -1) {
                    console.log(`Setting currentPage to last page: ${pagesResult.length - 1}`);
                    setCurrentPage(pagesResult.length - 1); // Set to last page
                } else {
                    console.log(`Setting currentPage to initialPage: ${initialPage || 0}`);
                    setCurrentPage(initialPage || 0); // Set to initialPage or default to 0
                }
                isSplittingRef.current = false;
            })
            .catch((error) => {
                console.error('Error splitting content:', error);
                isSplittingRef.current = false;
            });
    }, [text, maxColumnHeight, initialPage]);

    // Effect to detect page changes and notify about headings
    useEffect(() => {
        console.log(`useEffect: Current page changed to ${currentPage}`);
        if (pageHeadings[currentPage]) {
            console.log(`Heading encountered on page ${currentPage}: ${pageHeadings[currentPage]}`);
            onHeadingEncountered(pageHeadings[currentPage]);
        }
    }, [currentPage, pageHeadings]);

    // Navigation functions
    const goToNextPage = () => {
        console.log('Navigating to next page');
        if (currentPage === pages.length - 1) {
            console.log('Current page is the last page. Triggering onNextChapter.');
            onNextChapter(); // Call the next chapter function
        } else {
            setCurrentPage((prev) => {
                const newPage = Math.min(pages.length - 1, prev + 1);
                console.log(`Changing page from ${prev} to ${newPage}`);
                return newPage;
            });
        }
    };

    const goToPreviousPage = () => {
        console.log('Navigating to previous page');
        if (currentPage === 0) {
            console.log('Current page is the first page. Triggering onPrevChapter.');
            onPrevChapter(); // Call the previous chapter function
        } else {
            setCurrentPage((prev) => {
                const newPage = Math.max(0, prev - 1);
                console.log(`Changing page from ${prev} to ${newPage}`);
                return newPage;
            });
        }
    };

    // Функция для обработки выделения текста
    const handleSelectionChange = () => {
        const sel = window.getSelection();
        if (sel && sel.toString().trim().length > 0) {
            const range = sel.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            console.log(`Text selected: "${sel.toString()}"`);
            console.log('Selection range:', range);
            console.log('Selection rect:', rect);
            setSelection({
                text: sel.toString(),
                range: range,
                rect: rect,
            });
        } else {
            console.log('No text selected or selection cleared.');
            setSelection({ text: '', range: null, rect: null });
        }
    };

    useEffect(() => {
        console.log('Adding event listeners for selection changes');
        document.addEventListener('mouseup', handleSelectionChange);
        document.addEventListener('keyup', handleSelectionChange);

        return () => {
            console.log('Removing event listeners for selection changes');
            document.removeEventListener('mouseup', handleSelectionChange);
            document.removeEventListener('keyup', handleSelectionChange);
        };
    }, []);

    // Функция для позиционирования кнопки
    const getButtonStyle = () => {
        if (selection.rect) {
            const { top, left, width } = selection.rect;
            console.log('Calculating button position');
            return {
                position: 'absolute' as 'absolute',
                top: top - 170, // Располагаем кнопку над выделением
                left: left + width / 2,
                transform: 'translateX(-50%)',
                zIndex: 1000,
            };
        }
        return { display: 'none' };
    };

    // Функция для обработки нажатия на кнопку
    const handleHighlight = () => {
        console.log('Button clicked: handleHighlight triggered');
        if (selection.range) {
            const containsImage = selection.range.cloneContents().querySelector('img') !== null;
            if (containsImage) {
                console.log('Selection contains an image. Skipping highlight.');
                // Опционально: уведомите пользователя
                alert('Выделение содержит изображение. Выделение текста не выполнено.');
                // Очистка выделения
                window.getSelection()?.removeAllRanges();
                setSelection({ text: '', range: null, rect: null });
                return;
            }

            const selectedText = selection.text;
            console.log(`Selected text: "${selectedText}"`);

            // Создаём новый HTML с выделением
            const highlightedText = `<span class="highlight">${selectedText}</span>`;

            // Функция для экранирования специальных символов в строке
            const escapeRegExp = (string: string) => {
                return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            };

            // Функция для замены выделенного текста в HTML
            const replaceSelectedText = (html: string) => {
                const regex = new RegExp(`(${escapeRegExp(selectedText)})`, 'i');
                const replaced = html.replace(regex, highlightedText);
                console.log(`Replacing "${selectedText}" with "${highlightedText}"`);
                console.log(`Before: "${html}"`);
                console.log(`After replacement: "${replaced}"`);
                return replaced;
            };

            // Определяем, в какой колонке находится выделение
            const container = window.getSelection()?.anchorNode?.parentElement;
            let column = 'left'; // По умолчанию левая колонка

            if (container) {
                if (container.closest('.left-column')) {
                    column = 'left';
                } else if (container.closest('.right-column')) {
                    column = 'right';
                }
            }
            console.log(`Determined column: ${column}`);

            // Получаем текущий HTML страницы
            const currentPageContent = pages[currentPage];
            let updatedColumnHTML = '';

            if (column === 'left') {
                updatedColumnHTML = replaceSelectedText(currentPageContent.left);
                console.log('Updated left column HTML:', updatedColumnHTML);
            } else {
                updatedColumnHTML = replaceSelectedText(currentPageContent.right);
                console.log('Updated right column HTML:', updatedColumnHTML);
            }

            // Обновляем состояние
            setPages((prevPages) => {
                const newPages = [...prevPages];
                if (column === 'left') {
                    newPages[currentPage] = {
                        ...newPages[currentPage],
                        left: updatedColumnHTML,
                    };
                    console.log(`Updated left column of page ${currentPage}`);
                } else {
                    newPages[currentPage] = {
                        ...newPages[currentPage],
                        right: updatedColumnHTML,
                    };
                    console.log(`Updated right column of page ${currentPage}`);
                }
                return newPages;
            });

            // Очищаем выделение
            window.getSelection()?.removeAllRanges();
            console.log('Cleared text selection');
            setSelection({ text: '', range: null, rect: null });
        } else {
            console.log('No selection range available.');
        }
    };

    if (pages.length === 0) {
        return <div className="text-center p-4">No text to display.</div>;
    }

    return (
        <div className="mx-auto p-10 relative">
            {/* Кнопка для выделения */}
            {selection.text && (
                <button
                    ref={buttonRef}
                    onClick={handleHighlight}
                    style={getButtonStyle()}
                    className="px-4 py-1 bg-red-400 rounded-md border-2 border-black"
                >
                    Выделить
                </button>
            )}

            {/* Навигационные элементы */}
            <div className="flex justify-between items-center mb-4">
                <Button onClick={goToPreviousPage} variant="outline">
                    <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
                <span>
                    Page {currentPage + 1} of {pages.length}
                </span>
                <Button onClick={goToNextPage} variant="outline">
                    Next <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
            </div>

            {/* Содержимое страницы */}
            {pages.length > 0 && !isLoadingUseChapter && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[100px] px-[80px] text-[20px] relative font-segoeUI text-justify leading-[1.4rem]  ">
                    {/* Левая колонка */}
                    <div className="left-column">{parse(pages[currentPage].left || '')}</div>
                    {/* Правая колонка */}
                    <div className=" right-column">{parse(pages[currentPage].right || '')}</div>
                </div>
            )}
        </div>
    );
}
