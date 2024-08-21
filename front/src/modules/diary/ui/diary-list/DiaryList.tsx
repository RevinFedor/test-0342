import React from 'react';
import { DiaryEntry } from '../../types/diary';
import DiaryEntryCard from './DiaryEntryCard';
import { Skeleton } from '@/shared/ui/components/ui/skeleton';
import { CardContent, Card } from '@/shared/ui/components/ui/card';

interface DiaryListProps {
    diaryEntries: DiaryEntry[];
    onDelete: (id: any) => void;
    onClick: (entry: DiaryEntry) => void;
    onUpdate: (id: string, patch: any) => void;
    isLoading: boolean;
}

const DiaryList: React.FC<DiaryListProps> = ({ diaryEntries, onDelete, onClick, onUpdate, isLoading }) => {
    const SkeletonCard = () => (
        <Card className="p-4 border rounded-lg cursor-pointer text-white hover:scale-[1.01] transition-all">
            <CardContent className="space-y-4">
                <div className="flex justify-between mb-4">
                    <Skeleton className="h-6 w-40 " />

                        <Skeleton className="h-8 w-7 " />

                </div>
                <Skeleton className="h-10 w-full " />
                <Skeleton className="h-6 w-32 " />
            </CardContent>
        </Card>
    );

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                {[...Array(12)].map((_, index) => (
                    <SkeletonCard key={index} />
                ))}
            </div>
        );
    }
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {diaryEntries.map((entry) => (
                <DiaryEntryCard key={entry._id} entry={entry} onDelete={onDelete} onClick={onClick} onUpdate={onUpdate} />
            ))}
        </div>
    );
};

export default DiaryList;
