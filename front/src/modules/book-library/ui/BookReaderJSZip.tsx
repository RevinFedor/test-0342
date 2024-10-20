import React, { useState, useEffect, useCallback, useRef } from 'react';
import JSZip from 'jszip';
import parse, { domToReact, HTMLReactParserOptions, Element } from 'html-react-parser';
import { useParams } from 'react-router-dom';
import { Button } from '@/shared/ui/components/ui/button';
import { ScrollArea } from '@/shared/ui/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { useGetBookContentQuery } from '../model/booksApiSlice';

interface Chapter {
    label: string;
    href: string;
    level: number;
}

const BookReaderJSZip: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [currentContent, setCurrentContent] = useState<string>('');
    const [currentCSS, setCurrentCSS] = useState<string>('');
    const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filePath, setFilePath] = useState<string | undefined>();

    const { data: bookContent, isLoading: isLoadingContent, error } = useGetBookContentQuery(filePath ?? '');

    // Playback-related states
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedText, setSelectedText] = useState<string>('');
    const [highlightedSentences, setHighlightedSentences] = useState<number>(-1);
    const [sentences, setSentences] = useState<string[]>([]);
    const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // Function to extract sentences from HTML content
    const extractSentences = (html: string): string[] => {
        // Strip HTML tags for sentence splitting
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const text = tempDiv.innerText;
        // Simple sentence splitter based on period. Adjust regex as needed.
        const regex = /[^\.!\?]+[\.!\?]+/g;
        return text.match(regex) || [];
    };

    // Function to handle text selection
    const handleMouseUp = () => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0 && contentRef.current?.contains(selection.anchorNode)) {
            setSelectedText(selection.toString());
        } else {
            setSelectedText('');
        }
    };

    useEffect(() => {
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    // Function to start playback
    const startPlayback = () => {
        if (!selectedText) return;

        const allSentences = extractSentences(currentContent);
        setSentences(allSentences);

        // Find the starting sentence index based on the selected text
        const startIndex = allSentences.findIndex((sentence) => sentence.includes(selectedText));
        if (startIndex === -1) {
            alert('Selected text not found in sentences.');
            return;
        }

        setHighlightedSentences(startIndex);
        setIsPlaying(true);

        playbackIntervalRef.current = setInterval(() => {
            setHighlightedSentences((prev) => {
                if (prev + 1 < allSentences.length) {
                    return prev + 1;
                } else {
                    // End of current chapter, move to next
                    if (currentChapter) {
                        const currentIndex = chapters.findIndex((ch) => ch.href === currentChapter.href);
                        const nextChapter = chapters[currentIndex + 1];
                        if (nextChapter) {
                            handleChapterClick(nextChapter);
                            return 0; // Start from first sentence of next chapter
                        }
                    }
                    stopPlayback();
                    return prev;
                }
            });
        }, 1000);
    };

    // Function to stop playback
    const stopPlayback = () => {
        if (playbackIntervalRef.current) {
            clearInterval(playbackIntervalRef.current);
            playbackIntervalRef.current = null;
        }
        setIsPlaying(false);
        setHighlightedSentences(-1);
    };

    // Function to extract HTML with highlighted sentences
    const getHighlightedContent = () => {
        if (highlightedSentences === -1) {
            return parse(currentContent);
        }

        const allSentences = extractSentences(currentContent);
        return allSentences.map((sentence, index) => {
            if (index === highlightedSentences) {
                return (
                    <span key={index} style={{ backgroundColor: 'yellow' }}>
                        {sentence}{' '}
                    </span>
                );
            }
            return <span key={index}>{sentence} </span>;
        });
    };

    // Function to extract HTML with highlighted sentences including sentence indices
    const getParsedContent = () => {
        if (highlightedSentences === -1) {
            return parse(currentContent);
        }

        const allSentences = extractSentences(currentContent);
        return parse(currentContent, {
            replace: (domNode) => {
                if (domNode.type === 'text') {
                    const text = domNode.data;
                    const sentenceList = extractSentences(text);
                    if (sentenceList.length === 0) return undefined;

                    return (
                        <>
                            {sentenceList.map((sentence, index) => {
                                const globalIndex = allSentences.findIndex((s) => s === sentence);
                                if (globalIndex === highlightedSentences) {
                                    return (
                                        <span key={globalIndex} style={{ backgroundColor: 'yellow' }}>
                                            {sentence}{' '}
                                        </span>
                                    );
                                }
                                return <span key={globalIndex}>{sentence} </span>;
                            })}
                        </>
                    );
                }
            },
        });
    };

    // Function to load the book content
    const loadBook = useCallback(async () => {
        if (!bookContent?.content) {
            console.warn('No book content available to load.');
            setIsLoading(false);
            return;
        }

        try {
            const zip = await JSZip.loadAsync(bookContent.content); // Распаковка файла

            // Извлечение CSS
            const cssFiles = zip.file(/\.css$/); // Получаем все CSS файлы
            let combinedCSS = '';
            for (const cssFile of cssFiles) {
                const cssContent = await cssFile.async('text');
                combinedCSS += cssContent; // Собираем все стили
            }
            setCurrentCSS(combinedCSS);

           


            const tocFile = zip.file('OEBPS/toc.ncx') || zip.file('toc.ncx');

            const tocContent = tocFile ? await tocFile.async('text') : '';
            const tocParser = new DOMParser();
            const tocDoc = tocParser.parseFromString(tocContent, 'application/xml');

            const navPoints = tocDoc.getElementsByTagName('navPoint');
            const newChapters: Chapter[] = Array.from(navPoints).map((item, index) => ({
                label: item.getElementsByTagName('text')[0]?.textContent?.trim() || `Chapter ${index + 1}`,
                href: item.getElementsByTagName('content')[0]?.getAttribute('src') || '',
                level: Number(item.getAttribute('playOrder')) || 0,
            }));

            setChapters(newChapters);

            // Открытие первой главы
            if (newChapters.length > 0) {
                const firstChapterHref = newChapters[0].href;
                const firstChapterFile = zip.file(`OEBPS/${firstChapterHref}`) || zip.file(firstChapterHref);
                const firstChapterContent = firstChapterFile ? await firstChapterFile.async('text') : '';
                setCurrentContent(firstChapterContent);
                setCurrentChapter(newChapters[0]);
            }
        } catch (error) {
            console.error('Error processing book with JSZip:', error);
        } finally {
            setIsLoading(false);
        }
    }, [bookContent?.content]);

    useEffect(() => {
        if (bookContent) {
            loadBook();
        }
    }, [bookContent, loadBook]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`http://localhost:3500/api/books/${id}`);
                const data = await response.json();
                setFilePath(data.filePath);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [id]);

    const handleChapterClick = async (chapter: Chapter) => {
        if (filePath) {
            try {
                setIsLoading(true);

                const zip = await JSZip.loadAsync(bookContent?.content || '');

                const chapterFile = zip.file(`OEBPS/${chapter.href}`) || zip.file(chapter.href);

                const chapterContent = chapterFile ? await chapterFile.async('text') : '';
                setCurrentContent(chapterContent);

                setCurrentChapter(chapter);

                // Reset playback state when changing chapters
                stopPlayback();
            } catch (error) {
                console.error('Error loading chapter:', error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    // Clean up playback on unmount
    useEffect(() => {
        return () => {
            stopPlayback();
        };
    }, []);

    if (isLoadingContent || isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (error) {
        return <div className="flex justify-center items-center h-screen text-red-500">Error loading book: {error.toString()}</div>;
    }

    return (
        <div className="h-screen flex">
            {/* Боковое меню для навигации по главам */}
            <div className="w-1/4 bg-gray-200 p-4">
                <ScrollArea className="h-[calc(100vh-100px)]">
                    {chapters.map((chapter, index) => (
                        <Button
                            key={index}
                            variant="ghost"
                            className={`w-full justify-start pl-${chapter.level * 4} ${currentChapter?.href === chapter.href ? 'bg-secondary' : ''}`}
                            onClick={() => handleChapterClick(chapter)}
                        >
                            {chapter.label}
                        </Button>
                    ))}
                </ScrollArea>
            </div>

            {/* Основное содержимое книги с применением CSS */}
            <div className="w-3/4 h-full p-4 overflow-auto" ref={contentRef}>
                <style>{currentCSS}</style> {/* Вставляем CSS */}
                <div>{getParsedContent()}</div>
                {/* Play and Stop buttons */}
                {selectedText && !isPlaying && (
                    <Button className="fixed bottom-10 right-10" onClick={startPlayback}>
                        Play
                    </Button>
                )}
                {isPlaying && (
                    <Button className="fixed bottom-10 right-10" onClick={stopPlayback}>
                        Stop
                    </Button>
                )}
            </div>
        </div>
    );
};

export default BookReaderJSZip;
