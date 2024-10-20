// EbookRendition.tsx
import React, { useEffect, useRef } from 'react';
import { Book } from 'epubjs';

interface EbookRenditionProps {
    book: Book;
    currentLocation: string | undefined;
    onLocationChange: (location: string) => void;
}

const EbookRendition: React.FC<EbookRenditionProps> = ({ book, currentLocation, onLocationChange }) => {
    const viewerRef = useRef<HTMLDivElement>(null);
    const renditionRef = useRef<any>(null);

    useEffect(() => {
        if (book && viewerRef.current) {
            renditionRef.current = book.renderTo(viewerRef.current, {
                width: "100%",
                height: "100%",
            });

            renditionRef.current.display(currentLocation);

            renditionRef.current.on("relocated", (location: any) => {
                onLocationChange(location.start.cfi);
            });

            return () => {
                renditionRef.current.destroy();
            };
        }
    }, [book, currentLocation, onLocationChange]);

    return (
        <div ref={viewerRef} style={{ width: "100%", height: "100%" }}></div>
    );
};

export default EbookRendition;
