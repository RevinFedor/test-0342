import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ePub, { Book, Rendition } from 'epubjs';
import { ScrollArea } from '@/shared/ui/components/ui/scroll-area';
import { Button } from '@/shared/ui/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useGetBookContentQuery } from '../model/booksApiSlice';
import { Sheet, SheetContent, SheetTrigger } from '@/shared/ui/components/ui/sheet'; // Import the Sheet components
import { BarChartBigIcon } from 'lucide-react';
import EbookReader from './EbookReader';

interface Chapter {
    title: string;
    href: string;
    content?: string;
}

const BookReader: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [book, setBook] = useState<Book | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filePath, setFilePath] = useState<string | undefined>();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false); // State for drawer open/close

    const { data: bookContent, isLoading: isLoadingContent, error } = useGetBookContentQuery(filePath ?? '');
    console.log(book);

    useEffect(() => {
        if (bookContent) {
            const loadBook = async () => {
                try {
                    const newBook = ePub(bookContent.content);
                    await newBook.ready;
                    setBook(newBook);

                    const spine = newBook.spine as any;
                    const newChapters: Chapter[] = [];

                    for (const item of spine.items) {
                        const doc = await newBook.load(item.href);
                        const title = extractChapterTitle(doc) || item.label || 'Без названия';
                        newChapters.push({
                            title,
                            href: item.href,
                        });
                    }

                    setChapters(newChapters);
                    if (newChapters.length > 0) {
                        setCurrentChapter(newChapters[0]);
                    }
                } catch (error) {
                    console.error('Error processing book:', error);
                } finally {
                    setIsLoading(false);
                }
            };

            loadBook();
        }
    }, [bookContent]);

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

    const extractChapterTitle = (doc: Document): string => {
        const headingElements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
        if (headingElements.length > 0) {
            return headingElements[0].textContent?.trim() || 'Без названия';
        }

        const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
        let node: Node | null;
        while ((node = walker.nextNode())) {
            const text = node.textContent?.trim();
            if (text) {
                return text;
            }
        }

        return 'Без названия';
    };

    const handleChapterClick = async (chapter: Chapter) => {
        if (book) {
            const content = await book.load(chapter.href);
            setCurrentChapter({ ...chapter, content: content.documentElement.innerHTML });
        }
    };

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
        <div className="">
            {/* Side menu for chapters */}
            <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <SheetTrigger asChild>
                    <Button variant="outline" onClick={() => setIsDrawerOpen(true)}>
                        <BarChartBigIcon />
                    </Button>
                </SheetTrigger>
                <br />
                <SheetContent side="left">
                    <ScrollArea className="h-[calc(100vh-100px)]">
                        {chapters.map((chapter, index) => (
                            <Button
                                key={index}
                                variant="ghost"
                                className={`w-full justify-start ${currentChapter?.href === chapter.href ? 'bg-secondary' : ''}`}
                                onClick={() => handleChapterClick(chapter)}
                            >
                                {chapter.title}
                            </Button>
                        ))}
                    </ScrollArea>
                </SheetContent>
            </Sheet>

            <div className="w-full p-4">
                {currentChapter && (
                    <>

                        <EbookReader
                            content={currentChapter.content || ''}
                            
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default BookReader;
