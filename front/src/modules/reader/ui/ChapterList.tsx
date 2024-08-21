import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/components/ui/card';
import { ChapterItem } from './ChapterItem';
import { Chapter } from '../model/types';
import copy from 'clipboard-copy';

interface ChapterListProps {
    chapters: Chapter[];
}

export const ChapterList: React.FC<ChapterListProps> = ({ chapters }) => {
    const [expandedChapters, setExpandedChapters] = useState<Record<number, boolean>>({});
    const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

    const toggleChapter = useCallback((index: number) => {
        setExpandedChapters((prev) => ({ ...prev, [index]: !prev[index] }));
    }, []);

    // копирование + задежка на офрледенной главе при копироавнеи
    const copyToClipboard = useCallback((text: string, id: string) => {
        copy(text)
            .then(() => {
                setCopiedStates((prev) => ({ ...prev, [id]: true }));
                setTimeout(() => {
                    setCopiedStates((prev) => ({ ...prev, [id]: false }));
                }, 2000);
            })
            .catch((err: Error) => {
                console.error('Ошибка при копировании:', err);
            });
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl font-semibold">Содержание</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {chapters.map((chapter, index) => (
                        <ChapterItem
                            key={index}
                            chapter={chapter}
                            index={index}
                            expanded={expandedChapters[index]}
                            copiedState={copiedStates[`chapter-${index}`]}
                            onToggle={() => toggleChapter(index)}
                            onCopy={(text) => copyToClipboard(text, `chapter-${index}`)}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
