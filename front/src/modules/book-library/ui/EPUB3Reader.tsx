// EPUB3Reader.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Book } from 'epubjs';

interface Chapter {
    label: string;
    href: string;
    cfi: string;
    level: number;
}

interface EPUB3ReaderProps {
    book: Book;
    currentLocation: string | undefined;
    onLocationChange: (location: string) => void;
    chapters: Chapter[];
    currentChapter: Chapter;
    setCurrentChapter: (chapter: Chapter) => void;
}

const EPUB3Reader: React.FC<EPUB3ReaderProps> = ({
    book,
    currentLocation,
    onLocationChange,
    chapters,
    currentChapter,
    setCurrentChapter
}) => {
    const renditionRef = useRef<any>(null);
    const [notes, setNotes] = useState<{ [cfi: string]: string }>({});

    useEffect(() => {
        if (book && currentLocation) {
            renditionRef.current = book.renderTo("viewer", {
                width: "100%",
                height: "100%"
            });

            renditionRef.current.display(currentLocation).then(() => {
                renditionRef.current.on("relocated", (location: any) => {
                    onLocationChange(location.start.cfi);
                    const chapter = chapters.find(ch => ch.cfi === location.start.cfi);
                    if (chapter && chapter.href !== currentChapter.href) {
                        setCurrentChapter(chapter);
                    }
                });

                // Добавление обработчика клика для добавления заметок
                renditionRef.current.on('rendered', () => {
                    const document = renditionRef.current.document;

                    document.addEventListener('dblclick', (e: any) => {
                        const selection = book.selection();
                        const selectedText = selection.text();
                        const cfiRange = selection.range ? book.cfi.fromRange(selection.range) : '';

                        if (selectedText && cfiRange) {
                            const note = prompt('Добавьте заметку для выделенного текста:');
                            if (note) {
                                setNotes(prev => ({ ...prev, [cfiRange]: note }));
                            }
                        }
                    });

                    // Отображение заметок
                    Object.keys(notes).forEach(cfi => {
                        const note = notes[cfi];
                        renditionRef.current.annotations.add('highlight', cfi, {}, (e: any) => {
                            alert(`Заметка: ${note}`);
                        }, {
                            fill: 'yellow',
                            'fill-opacity': 0.5,
                            'pointer-events': 'bounding-box',
                        });
                    });
                });
            });

            return () => {
                renditionRef.current.destroy();
            };
        }
    }, [book, currentLocation, onLocationChange, chapters, currentChapter, setCurrentChapter, notes]);

    return (
        <div id="viewer" style={{ width: "100%", height: "100%" }}></div>
    );
};

export default EPUB3Reader;
