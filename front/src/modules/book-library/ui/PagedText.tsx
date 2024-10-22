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

interface PagedTextProps {
    text?: string;
    maxColumnHeight?: number; // Максимальная высота столбца в пикселях
}

interface Page {
    left: string;
    right: string;
}

export default function PagedText({ text = '', maxColumnHeight = 700 }: PagedTextProps) {
    const [pages, setPages] = useState<Page[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const isSplittingRef = useRef(false); // Флаг для предотвращения повторного вызова

    useEffect(() => {
        if (!text) {
            setPages([]);
            return;
        }

        // Предотвращение повторного вызова функции разбиения
        if (isSplittingRef.current) return;
        isSplittingRef.current = true;

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

        const splitHtmlIntoPages = async (html: string, maxHeight: number): Promise<Page[]> => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;

            await waitForImages(tempDiv);
            // Рекурсивная функция для сбора всех элементов
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

            const allElements: HTMLElement[] = [];
            tempDiv.childNodes.forEach((child) => collectElements(child, allElements));

            console.log(`Total elements to process: ${allElements.length}`);

            // Функция для оценки высоты элемента
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

            const pagesArray: Page[] = [];
            let currentPageContent: Page = { left: '', right: '' };
            let currentColumnHeight = [0, 0]; // [leftHeight, rightHeight]
            let currentColumn = 0; // 0 - left, 1 - right

            for (const element of allElements) {
                const elHeight = estimateElementHeight(element);
                console.log(`Element: <${element.tagName.toLowerCase()}>, Estimated Height: ${elHeight}px`);

                if (elHeight > maxHeight) {
                    console.warn(`Element <${element.tagName.toLowerCase()}> exceeds max height and will be skipped.`);
                    continue; // Skip or handle oversized elements separately
                }

                if (currentColumnHeight[currentColumn] + elHeight > maxHeight) {
                    if (currentColumn === 0 && currentColumnHeight[1] === 0) {
                        // Switch to right column
                        currentColumn = 1;
                        console.log(`Switching to right column`);
                    } else {
                        // Create a new page
                        pagesArray.push(currentPageContent);
                        console.log(`Creating new page`);
                        currentPageContent = { left: '', right: '' };
                        currentColumnHeight = [0, 0];
                        currentColumn = 0; // Start with left column again
                    }
                }

                // Add element to the current column
                const htmlString = element.outerHTML || element.innerHTML || '';
                currentPageContent[currentColumn === 0 ? 'left' : 'right'] += htmlString;
                currentColumnHeight[currentColumn] += elHeight;

                console.log(`Added to ${currentColumn === 0 ? 'left' : 'right'} column, new height: ${currentColumnHeight[currentColumn]}px`);
            }

            // Add the last page
            if (currentPageContent.left || currentPageContent.right) {
                pagesArray.push(currentPageContent);
            }

            console.log(`Total pages created: ${pagesArray.length}`);
            return pagesArray;
        };

        // Выполняем асинхронное разбиение
        splitHtmlIntoPages(text, maxColumnHeight)
            .then((pagesResult) => {
                setPages(pagesResult);
                setCurrentPage(0);
                isSplittingRef.current = false; // Сбрасываем флаг после завершения
            })
            .catch((error) => {
                console.error('Ошибка при разбиении контента:', error);
                isSplittingRef.current = false; // Сбрасываем флаг даже при ошибке
            });
    }, [text, maxColumnHeight]);

    const goToPreviousPage = () => {
        setCurrentPage((prev) => Math.max(0, prev - 1));
    };

    const goToNextPage = () => {
        setCurrentPage((prev) => Math.min(pages.length - 1, prev + 1));
    };

    if (pages.length === 0) {
        return <div className="text-center p-4">Нет текста для отображения.</div>;
    }

    // Опции для html-react-parser
    const parserOptions: HTMLReactParserOptions = {
        replace: (domNode) => {
            if (domNode.type === 'tag' && domNode.name === 'img') {
                const element = domNode as DomElement;
                const attribs = element.attribs;

                // Преобразование атрибутов
                const props: any = {};
                for (const [key, value] of Object.entries(attribs)) {
                    if (key === 'class') {
                        props['className'] = value;
                    } else if (key === 'style') {
                        props['style'] = parseStyle(value);
                    } else {
                        props[key] = value;
                    }
                }

                // Добавление классов Tailwind CSS
                props.className = `${props.className || ''} max-w-full h-auto`.trim();

                // Обеспечение наличия атрибута alt
                if (!props.alt) {
                    props.alt = '';
                }

                return <img {...props} />;
            }
        },
    };

    return (
        <div className="mx-auto p-10">
            {/* Кнопки навигации перенесены выше */}
            <div className="flex justify-between items-center mb-4">
                <Button onClick={goToPreviousPage} disabled={currentPage === 0} variant="outline">
                    <ChevronLeft className="mr-2 h-4 w-4" /> Предыдущая
                </Button>
                <span>
                    Страница {currentPage + 1} из {pages.length}
                </span>
                <Button onClick={goToNextPage} disabled={currentPage === pages.length - 1} variant="outline">
                    Следующая <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
            {pages.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4  relative">
                    {' '}
                    {/* Добавлен pl-4 для отступа слева */}
                    {/* Абсолютно позиционированная красная линия */}
                    <div
                        className="absolute left-0 top-0"
                        style={{
                            width: '2px',
                            height: `${maxColumnHeight}px`,
                            backgroundColor: 'red',
                        }}
                    ></div>
                    <div className="border px-4 rounded">{parse(pages[currentPage].left || '', parserOptions)}</div>
                    <div className="border px-4 rounded">{parse(pages[currentPage].right || '', parserOptions)}</div>
                </div>
            )}
        </div>
    );
}
