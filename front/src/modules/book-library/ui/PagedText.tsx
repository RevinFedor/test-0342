import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/ui/components/ui/button';
import parse from 'html-react-parser';

interface PagedTextProps {
    text?: string;
    wordsPerPage?: number;
    onNextChapter: () => void; // Функция для перехода на следующую главу
    onPrevChapter: () => void; // Функция для перехода на предыдущую главу
}

export default function PagedText({ text = '', wordsPerPage = 250, onNextChapter, onPrevChapter }: PagedTextProps) {
    const [pages, setPages] = useState<string[][]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [isFocused, setIsFocused] = useState(false); // Отслеживаем фокус
    const [isScrollingBlocked, setIsScrollingBlocked] = useState(false); // Новый флаг для блокировки прокрутки

    useEffect(() => {
        if (!text) {
            setPages([]);
            return;
        }

        const splitHtmlIntoPages = (html: string, wordsPerPage: number) => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;

            const words = tempDiv.innerText.split(/\s+/);
            const pagesArray: string[][] = [];
            let currentPageWords: string[] = [];
            let currentColumn: string[] = [];

            const processNode = (node: Node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                    const nodeWords = node.textContent?.split(/\s+/) || [];
                    for (const word of nodeWords) {
                        if (currentColumn.length < wordsPerPage) {
                            currentColumn.push(word);
                        } else {
                            if (currentPageWords.length === 0) {
                                currentPageWords.push(currentColumn.join(' '));
                                currentColumn = [word];
                            } else {
                                currentPageWords.push(currentColumn.join(' '));
                                pagesArray.push(currentPageWords);
                                currentPageWords = [];
                                currentColumn = [word];
                            }
                        }
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    const element = node as Element;
                    const tag = element.tagName.toLowerCase();
                    const attributes = Array.from(element.attributes)
                        .map((attr) => `${attr.name}="${attr.value}"`)
                        .join(' ');

                    currentColumn.push(`<${tag}${attributes ? ' ' + attributes : ''}>`);
                    for (const childNode of Array.from(node.childNodes)) {
                        processNode(childNode);
                    }
                    currentColumn.push(`</${tag}>`);
                }
            };

            processNode(tempDiv);

            if (currentColumn.length > 0) {
                currentPageWords.push(currentColumn.join(' '));
            }
            if (currentPageWords.length > 0) {
                pagesArray.push(currentPageWords);
            }

            return pagesArray;
        };

        const pagesArray = splitHtmlIntoPages(text, wordsPerPage);
        setPages(pagesArray);
        setCurrentPage(0);
    }, [text, wordsPerPage]);

    const goToPreviousPage = () => {
        if (currentPage === 0) {
            onPrevChapter(); // Переход на предыдущую главу, если это первая страница
        } else {
            setCurrentPage((prev) => Math.max(0, prev - 1));
        }
    };

    const goToNextPage = () => {
        if (currentPage === pages.length - 1) {
            onNextChapter(); // Переход на следующую главу, если это последняя страница
        } else {
            setCurrentPage((prev) => Math.min(pages.length - 1, prev + 1));
        }
    };

    const handleWheel = (event: React.WheelEvent) => {
        if (!isFocused || isScrollingBlocked) return; // Если компонент не в фокусе или прокрутка заблокирована, игнорируем

        if (event.deltaY < 0) {
            if (currentPage === 0) {
                setIsScrollingBlocked(true); // Блокируем прокрутку
                onPrevChapter(); // Переход на предыдущую главу
                setTimeout(() => setIsScrollingBlocked(false), 500); // Разблокируем через 500 мс
            } else {
                goToPreviousPage(); // Переход на предыдущую страницу
            }
        } else if (event.deltaY > 0) {
            if (currentPage === pages.length - 1) {
                setIsScrollingBlocked(true); // Блокируем прокрутку
                onNextChapter(); // Переход на следующую главу
                setTimeout(() => setIsScrollingBlocked(false), 500); // Разблокируем через 500 мс
            } else {
                goToNextPage(); // Переход на следующую страницу
            }
        }
    };

    if (pages.length === 0) {
        return <div className="text-center p-4">Нет текста для отображения.</div>;
    }

    return (
        <div
            className="mx-auto p-10  "
            onMouseEnter={() => setIsFocused(true)} // Устанавливаем фокус при наведении
            onMouseLeave={() => setIsFocused(false)} // Сбрасываем фокус при выходе
            onWheel={handleWheel} // Обрабатываем скролл только при фокусе
        >
            <div className="flex justify-center items-center text-[12px]">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={goToPreviousPage} className="bg-gray-300 p-2 rounded">
                        « Назад
                    </button>

                    <span className="text-[12px]">
                        Страница {currentPage + 1}/{pages.length}
                    </span>

                    <button onClick={goToNextPage} className="bg-gray-300 p-2 rounded">
                        Вперед »
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-[100px] px-[40px] leading-tight text-[20px] font-segoeUI">
                <div className="">{parse(pages[currentPage][0] || '')}</div>
                <div className="">{parse(pages[currentPage][1] || '')}</div>
            </div>
        </div>
    );
}
