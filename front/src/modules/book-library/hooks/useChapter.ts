// hooks/useChapter.ts
import { useState, useEffect } from 'react';
import JSZip from 'jszip';
import DOMPurify from 'dompurify';
import { getFullImagePath } from '../model/utils';


/**
 * Computes the Levenshtein distance between two strings.
 * @param a First string
 * @param b Second string
 * @returns Levenshtein distance
 */
export const levenshteinDistance = (a: string, b: string): number => {
    const an = a ? a.length : 0;
    const bn = b ? b.length : 0;
    if (an === 0) return bn;
    if (bn === 0) return an;
    const matrix = new Array<number[]>(bn + 1);
    for (let i = 0; i <= bn; ++i) {
        const row = (matrix[i] = new Array<number>(an + 1));
        row[0] = i;
    }
    const firstRow = matrix[0];
    for (let j = 1; j <= an; ++j) {
        firstRow[j] = j;
    }
    for (let i = 1; i <= bn; ++i) {
        for (let j = 1; j <= an; ++j) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                const substitution = matrix[i - 1][j - 1] + 1;
                const insertion = matrix[i][j - 1] + 1;
                const deletion = matrix[i - 1][j] + 1;
                matrix[i][j] = Math.min(substitution, insertion, deletion);
            }
        }
    }
    return matrix[bn][an];
};

/**
 * Calculates similarity between two strings using normalized Levenshtein distance.
 * @param a First string
 * @param b Second string
 * @returns Similarity score between 0 and 1
 */
const calculateSimilarity = (a: string, b: string): number => {
    const distance = levenshteinDistance(a, b);
    const maxLen = Math.max(a.length, b.length);
    return maxLen === 0 ? 1 : 1 - distance / maxLen;
};

const getHashForChapter = (href: string, duplicates: Record<string, string[]>): string | null => {
    for (const [hash, chapterList] of Object.entries(duplicates)) {
        if (chapterList.includes(href)) {
            return hash; // Возвращаем хеш, если глава найдена в списке дубликатов
        }
    }
    return null; // Если глава не найдена
};



interface UseChapterProps {
    bookFile: ArrayBuffer | null;
    href: string;
    images: Record<string, string>;
    knownChapterTitles: any;
    duplicates: any;
}

interface HeadingInfo {
    tag: string;
    text: string;
    index: number;
}


const useChapter = ({ bookFile, href, images, knownChapterTitles, duplicates }: UseChapterProps) => {
    const [content, setContent] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [headings, setHeadings] = useState<HeadingInfo[]>([]); // Новое состояние для заголовков (div блоки в разметке )
    const [previousChapter, setPreviousChapter] = useState<string | null>(null); // Состояние для предыдущей главы
    // для обработкb дублирующейся главы надо отдельно сдлетаь 
    const [isLoading, setIsLoading] = useState<boolean>(false); // New loading state

    useEffect(() => {
        if (!bookFile) {
            return;
        }
        const loadChapter = async () => {
            setIsLoading(true); // Set loading to true at the start
            try {
                //! console.log('Loading chapter with href:', href);
                const zip = await JSZip.loadAsync(bookFile);
                const baseHref = href.split('#')[0];
                let chapterFile = zip.file(`OPS/${baseHref}`);

                //! Пропускаем обработку для дублирующейся главы
                const currentHash = getHashForChapter(href, duplicates);
                if (currentHash) {
                    const duplicateChapters = duplicates[currentHash];
                    console.log(duplicateChapters);

                    if (duplicateChapters.includes(previousChapter)) {
                        setIsLoading(false); // Set loading to false before returning
                        return;
                    }
                }

                if (!chapterFile) {
                    const availableFiles = Object.keys(zip.files);
                    const similarFile = availableFiles.find((file) => file.toLowerCase() === baseHref.toLowerCase());
                    if (similarFile) {
                        chapterFile = zip.file(similarFile);
                        console.warn(`Found a similar file name: ${similarFile}`);
                    } else {
                        throw new Error(`Chapter file not found: ${baseHref}`);
                    }
                }

                let contentFile = await chapterFile.async('string');
                contentFile = contentFile.replace(/<\?xml.*?\?>\s*/g, '');

                const parser = new DOMParser();
                const doc = parser.parseFromString(contentFile, 'application/xhtml+xml');
                const body = doc.body;

                if (body) {
                    const imagesInContent = body.querySelectorAll('img, image');
                    imagesInContent.forEach((imgElement) => {
                        const src = imgElement.getAttribute('src') || imgElement.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
                        if (src) {
                            const imagePath = getFullImagePath(baseHref, src);
                            const imageUri = images[imagePath] || images[src];

                            if (imageUri) {
                                if (imgElement instanceof HTMLImageElement || imgElement instanceof SVGImageElement) {
                                    if (imgElement instanceof HTMLImageElement) {
                                        imgElement.setAttribute('src', imageUri);
                                    } else {
                                        imgElement.setAttributeNS('http://www.w3.org/1999/xlink', 'href', imageUri);
                                    }

                                    imgElement.style.display = 'block';
                                    imgElement.style.marginLeft = 'auto';
                                    imgElement.style.marginRight = 'auto';
                                    imgElement.style.maxWidth = '100%';
                                    imgElement.style.height = 'auto';
                                }
                            } else {
                                console.warn(`Image not found: ${src}`);
                            }
                        }
                    });

                    //! логи на добавление аттрибудто заголовка и парсинга
                    //! вся нагрузка тут
                    extractAndLogHeadings(doc.body, knownChapterTitles);
                    setContent(doc.body.outerHTML);
                    setPreviousChapter(href);
                } else {
                    throw new Error('The <body> tag was not found in the chapter content.');
                }
            } catch (err: any) {
                console.error('Error loading chapter content:', err);
                setError(err.message);
            } finally {
                setIsLoading(false); // Ensure loading is false at the end
            }
        };

        if (bookFile && href) {
            loadChapter();
        }
    }, [href, bookFile, images]);

    /**
     * Function to extract headings from the DOM and log them.
     * @param body DOM element <body>
     * @param knownChapterTitles List of known chapter titles
     */
    const extractAndLogHeadings = (body: HTMLElement, knownChapterTitles: string[]) => {
        const candidateHeadings: HeadingInfo[] = [];
        let index = 0;

        const normalizeText = (text: string): string => {
            return text
                .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
                .replace(/[\n\r]/g, ' ') // Remove line breaks
                .replace(/&nbsp;/g, ' ') // Replace HTML non-breaking spaces
                .trim()
                .toLowerCase();
        };

        const knownTitlesNormalized = knownChapterTitles.map(normalizeText);

        // Traverse the DOM to find potential headings
        const traverseDom = (element: Element) => {
            const textContent = element.textContent?.trim() || '';
            if (textContent.length > 0) {
                const normalizedText = normalizeText(textContent);

                for (const [i, chapterTitle] of knownTitlesNormalized.entries()) {
                    // Calculate similarity score
                    const similarity = calculateSimilarity(normalizedText, chapterTitle);

                    // Set a threshold for considering a match (e.g., similarity > 0.7)
                    if (similarity > 0.7) {
                        candidateHeadings.push({
                            tag: element.tagName,
                            text: textContent,
                            index: index++,
                            similarity,
                        });

                        //! чет он не хочется пушить
                        element.setAttribute('data-chapter-title', knownChapterTitles[i]);

                        break; // Stop checking other chapter titles for this element
                    }
                }
            }

            // Recurse on child elements
            Array.from(element.children).forEach((child) => traverseDom(child));
        };

        traverseDom(body);

        // Now, filter the candidate headings to keep only the best match
        if (candidateHeadings.length > 0) {
            // Sort candidates by similarity descending
            candidateHeadings.sort((a, b) => b.similarity - a.similarity);

            // Keep only the top candidate(s) with highest similarity
            const maxSimilarity = candidateHeadings[0].similarity;
            const bestHeadings = candidateHeadings.filter((h) => h.similarity === maxSimilarity);

            setHeadings(bestHeadings);
            console.log('Extracted Headings:', bestHeadings);
        } else {
            setHeadings([]);
            console.log('No matching headings found.');
        }
    };

    return { content, error, headings, isLoading }; // Return isLoading
};

export default useChapter;
