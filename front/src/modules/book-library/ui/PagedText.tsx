import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/ui/components/ui/button';
import parse, { domToReact, HTMLReactParserOptions, Element as DomElement } from 'html-react-parser';

// Функция для преобразования строки стилей в объект
const parseStyle = (styleString: string): React.CSSProperties => {
    return styleString.split(';').reduce((style: React.CSSProperties, rule) => {
        const [key, value] = rule.split(':').map((item) => item.trim());
        if (key && value) {
            // Преобразование kebab-case в camelCase
            const camelCaseKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase()) as keyof React.CSSProperties;
            style[camelCaseKey] = value;
        }
        return style;
    }, {});
};

//! функция для обработки изображений заранее
const waitForImages = (container: HTMLElement): Promise<void> => {
    const images = container.querySelectorAll('img');
    const promises = Array.from(images).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
        });
    });
    return Promise.all(promises).then(() => {});
};

//! Рекурсивная функция для сбора всех элементов
const collectElements = (node: Node, elements: HTMLElement[]) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        // Собираем все блочные элементы
        if (['P', 'H1', 'H2', 'H3', 'IMG', 'DIV', 'FIGURE', 'SECTION', 'ARTICLE'].includes(el.tagName)) {
            elements.push(el);
            // Не рекурсивно обходим детей, если это блочный элемент
            return;
        }
        // Рекурсивно обходим детей для других типов элементов
        el.childNodes.forEach((child) => collectElements(child, elements));
    }
    // Игнорируем текстовые узлы и другие типы узлов
};

//! Функция для оценки высоты элемента
const estimateElementHeight = (el: HTMLElement): number => {
    // Создаём временный контейнер для измерения
    const tempContainer = document.createElement('div');
    tempContainer.style.visibility = 'hidden';
    tempContainer.style.position = 'absolute';
    tempContainer.style.top = '0';
    tempContainer.style.left = '0';
    tempContainer.style.width = '800px'; //! Убедитесь, что это соответствует реальной ширине столбца
    tempContainer.style.fontSize = '16px'; // Установите соответствующие стили
    tempContainer.style.lineHeight = '1.5'; // Установите соответствующие стили

    // Клонируем элемент для измерения
    const clone = el.cloneNode(true) as HTMLElement;

    // Для изображений задаём фиксированные размеры или получаем реальные
    if (clone.tagName === 'IMG') {
        const img = clone as HTMLImageElement;
        if (!img.height || img.height === 0) {
            // Задаём стандартную высоту, если не задана
            img.style.height = '200px';
        }
        // Устанавливаем ширину, чтобы соответствовать колонке
        img.style.width = '100%';
        img.style.objectFit = 'contain';
        img.style.display = 'block'; // Чтобы убрать пробелы снизу
    }

    tempContainer.appendChild(clone);
    document.body.appendChild(tempContainer);
    const height = tempContainer.offsetHeight;
    document.body.removeChild(tempContainer);
    return height;
};

interface PagedTextProps {
    text?: string;
    maxColumnHeight?: number; // Максимальная высота столбца в пикселях
}

interface Page {
    left: string;
    right: string;
}

export default function PagedText({ text = '', maxColumnHeight = 700, onHeadingEncountered }: PagedTextProps) {
    const [pages, setPages] = useState<Page[]>([]);
    const [pageHeadings, setPageHeadings] = useState<Record<number, string>>({});
    const [currentPage, setCurrentPage] = useState(0);
    const isSplittingRef = useRef(false); // Prevent duplicate splitting

    useEffect(() => {
        if (!text) {    
            setPages([]);
            return;
        }

        if (isSplittingRef.current) return;
        isSplittingRef.current = true;

        const splitHtmlIntoPages = async (html: string, maxHeight: number): Promise<{ pages: Page[]; pageHeadings: Record<number, string> }> => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;

            // Wait for images to load
            await waitForImages(tempDiv);

            // Collect all elements
            const allElements: HTMLElement[] = [];

            
            tempDiv.childNodes.forEach((child) => collectElements(child, allElements));

            const pagesArray: Page[] = [];
            const pageHeadings: Record<number, string> = {};
            let currentPageContent: Page = { left: '', right: '' };
            let currentColumnHeight = [0, 0]; // [leftHeight, rightHeight]
            let currentColumn = 0; // 0 - left, 1 - right
            let currentPageIndex = 0;

            

            for (const element of allElements) {
                const elHeight = estimateElementHeight(element);

                if (elHeight > maxHeight) {
                    console.warn(`Element <${element.tagName.toLowerCase()}> exceeds max height and will be skipped.`);
                    continue;
                }

                if (currentColumnHeight[currentColumn] + elHeight > maxHeight) {
                    if (currentColumn === 0 && currentColumnHeight[1] === 0) {
                        currentColumn = 1;
                    } else {
                        pagesArray.push(currentPageContent);
                        currentPageContent = { left: '', right: '' };
                        currentColumnHeight = [0, 0];
                        currentColumn = 0;
                        currentPageIndex++;
                    }
                }


                
                // Check for data-chapter-title attribute
                if (element.hasAttribute('data-chapter-title')) {
                    const chapterTitle = element.getAttribute('data-chapter-title');
                    console.log(`Found heading on page ${currentPageIndex}: ${chapterTitle}`);
                    if (!pageHeadings[currentPageIndex]) {
                        pageHeadings[currentPageIndex] = chapterTitle!;
                    }
                } else{
                    console.log('Attribute not Found');
                    
                }

                // Add element to current column
                const htmlString = element.outerHTML || element.innerHTML || '';
                currentPageContent[currentColumn === 0 ? 'left' : 'right'] += htmlString;
                currentColumnHeight[currentColumn] += elHeight;
            }

            // Add the last page
            if (currentPageContent.left || currentPageContent.right) {
                pagesArray.push(currentPageContent);
            }

            return { pages: pagesArray, pageHeadings };
        };

        splitHtmlIntoPages(text, maxColumnHeight)
            .then(({ pages: pagesResult, pageHeadings: headingsResult }) => {
                setPages(pagesResult);
                setPageHeadings(headingsResult);
                setCurrentPage(0);
                isSplittingRef.current = false;
            })
            .catch((error) => {
                console.error('Error splitting content:', error);
                isSplittingRef.current = false;
            });
    }, [text, maxColumnHeight]);

    // Effect to detect page changes and notify about headings
    useEffect(() => {
        if (pageHeadings[currentPage]) {
            onHeadingEncountered(pageHeadings[currentPage]);
        }
    }, [currentPage, pageHeadings]);

    // Navigation functions
    const goToPreviousPage = () => {
        setCurrentPage((prev) => Math.max(0, prev - 1));
    };

    const goToNextPage = () => {
        setCurrentPage((prev) => Math.min(pages.length - 1, prev + 1));
    };

    if (pages.length === 0) {
        return <div className="text-center p-4">No text to display.</div>;
    }

    return (
        <div className="mx-auto p-10">
            <div className="flex justify-between items-center mb-4">
                <Button onClick={goToPreviousPage} disabled={currentPage === 0} variant="outline">
                    <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
                <span>
                    Page {currentPage + 1} of {pages.length}
                </span>
                <Button onClick={goToNextPage} disabled={currentPage === pages.length - 1} variant="outline">
                    Next <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
            {pages.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                    {/* Left Column */}
                    <div className="border px-4 rounded">{parse(pages[currentPage].left || '')}</div>
                    {/* Right Column */}
                    <div className="border px-4 rounded">{parse(pages[currentPage].right || '')}</div>
                </div>
            )}
        </div>
    );
}
