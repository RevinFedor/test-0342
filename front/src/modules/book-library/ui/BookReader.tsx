//!тут отлично работает оглавление но не работает орисовка текста нормально с парсинг html + картинки


import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import JSZip from 'jszip';
import { useGetBookByIdQuery } from '../model/booksApiSlice';
import { ScrollArea } from '@/shared/ui/components/ui/scroll-area';
import { Button } from '@/shared/ui/components/ui/button';
import { Loader2 } from 'lucide-react';
import htmlReactParser from 'html-react-parser';

interface Chapter {
    label: string;
    href: string;
    cfi: string; // CFI can be computed later if needed
    level: number; // Represents nesting level
}

const BookReader: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    // Fetch book data from server
    const { data: bookFile, isLoading: isLoadingContent, error } = useGetBookByIdQuery(id);

    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [currentChapter, setCurrentChapter] = useState<string | null>(null);
    const [content, setContent] = useState<string | null>(null);

    useEffect(() => {
        const loadEpub = async () => {
            if (bookFile) {
                const zip = await JSZip.loadAsync(bookFile);

                // Check for TOC for EPUB 2
                const tocFile = zip.file(/toc\.ncx/i)[0];

                if (tocFile) {
                    console.log('Detected EPUB 2---------------');

                    // EPUB 2: Parse toc.ncx for chapter titles
                    const tocContent = await tocFile.async('string');
                    const parser = new DOMParser();
                    const tocDoc = parser.parseFromString(tocContent, 'application/xml');

                    const newChapters: Chapter[] = Array.from(tocDoc.querySelectorAll('navPoint')).map((navPoint) => {
                        const label = navPoint.querySelector('navLabel > text')?.textContent || 'Chapter';
                        const playOrder = navPoint.getAttribute('playOrder') || '';
                        const href = navPoint.querySelector('content')?.getAttribute('src') || '';
                        return {
                            label,
                            href,
                            cfi: '',
                            level: parseInt(playOrder) || 1, // Adjust nesting level based on playOrder
                        };
                    });

                    setChapters(newChapters);
                    setCurrentChapter(newChapters[0]?.href || null); // Set the first chapter as default
                    return; // Exit after processing EPUB 2 TOC
                }
            }
        };

        loadEpub();
    }, [bookFile]);

    useEffect(() => {
        const loadChapterContent = async (href: string) => {
            if (href && bookFile) {
                const zip = await JSZip.loadAsync(bookFile);

                // Strip fragment identifier if present
                const baseHref = href.split('#')[0]; // Get the part before any '#' character
                console.log('Attempting to load:', baseHref);

                // Log available files for debugging
                const availableFiles = Object.keys(zip.files);
                console.log('Available files in ZIP:', availableFiles);

                const chapterFile = zip.file(`OPS/${baseHref}`);
                if (chapterFile) {
                    const contentFile = await chapterFile.async('string');
                    console.log('Chapter Content:', contentFile);
                    setContent(contentFile);
                } else {
                    // Attempt to find the file in a more flexible way (case-insensitive match)
                    const normalizedFile = availableFiles.find((file) => file.toLowerCase() === baseHref.toLowerCase());
                    if (normalizedFile) {
                        console.log(`Found similar file: ${normalizedFile}`);
                        const similarFile = zip.file(normalizedFile);
                        const contentFile = await similarFile.async('string');
                        console.log('Chapter Content from similar file:', contentFile);
                        setContent(contentFile);
                    } else {
                        console.error(`No matching file found for: ${baseHref}`);
                    }
                }
            }
        };

        if (currentChapter) {
            loadChapterContent(currentChapter);
        }
    }, [currentChapter, bookFile]);

    if (isLoadingContent) {
        return <Loader2 />;
    }

    if (error) {
        return <div>Error loading book: {error.message}</div>;
    }

    return (
        <div className="book-reader">
            <ScrollArea>
                <nav>
                    {chapters.map((chapter, index) => (
                        <Button key={index} onClick={() => setCurrentChapter(chapter.href)}>
                            {chapter.label}
                        </Button>
                    ))}
                </nav>
                <div className="chapter-content">{content ? htmlReactParser(content) : <div>Select a chapter to read.</div>}</div>
            </ScrollArea>
        </div>
    );
};

export default BookReader;
