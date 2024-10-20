// src/components/EpubReader.tsx

import React from 'react';
import parse from 'html-react-parser';

interface EpubReaderProps {
    content: string;
}

const EpubReader: React.FC<EpubReaderProps> = ({ content }) => {
    return (
        <div className="prose max-w-none">
            {parse(content)}
        </div>
    );
};

export default EpubReader;
