import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';
import { DiaryEntry } from '@/modules/diary/types/diary';
import { CalendarForm } from '../../../../shared/ui/CalendarForm';
import ForwardOriginLink from '../../../../shared/ui/ForwardOriginLink';

interface DiaryEntryCardProps {
    entry: DiaryEntry;
    onDelete: (id: any) => void;
    onClick: (entry: DiaryEntry) => void;
    onUpdate: (id: string, newDate: any) => void;
}

const DiaryEntryCard: React.FC<DiaryEntryCardProps> = ({ entry, onDelete, onClick, onUpdate }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const handlePrevClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.stopPropagation();
        setCurrentImageIndex((prevIndex) => (prevIndex === 0 ? entry.images.length - 1 : prevIndex - 1));
    };

    const handleNextClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.stopPropagation();
        setCurrentImageIndex((prevIndex) => (prevIndex === entry.images.length - 1 ? 0 : prevIndex + 1));
    };

    if (entry.images.length === 0) {
        return (
            <div className="p-4 border rounded-lg cursor-pointer text-white hover:scale-[1.01] transition-all" onClick={() => onClick(entry)}>
                <div>
                    <div className="flex justify-between mb-4">
                        <h2 className="text-xl font-semibold">{entry.title}</h2>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(entry._id);
                            }}
                            className="text-red-400 bg-transparent border-none hover:scale-125 transition-all"
                        >
                            <Trash2 />
                        </button>
                    </div>
                    <CalendarForm initialDate={entry.diaryDate} onDateChange={(newDate: any) => onUpdate(entry._id, { diaryDate: newDate.toISOString() })} />
                    <ForwardOriginLink selectedEntry={entry} />
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 border rounded-lg cursor-pointer text-white hover:scale-[1.01] transition-all" onClick={() => onClick(entry)}>
            <div>
                <div className="flex justify-between mb-4">
                    <h2 className="text-xl font-semibold">{entry.title}</h2>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(entry._id);
                        }}
                        className="text-red-400 bg-transparent border-none hover:scale-125 transition-all"
                    >
                        <Trash2 />
                    </button>
                </div>
                <CalendarForm initialDate={entry.diaryDate} onDateChange={(newDate: any) => onUpdate(entry._id, { diaryDate: newDate.toISOString() })} />
                <ForwardOriginLink selectedEntry={entry} />
            </div>
            <div className="relative w-full h-64 overflow-hidden rounded-lg">
                <img src={`http://localhost:3500${entry.images[currentImageIndex].path}`} alt={entry.images[currentImageIndex].fileName} className="w-full h-full object-cover" />
                {entry.images.length > 1 && (
                    <>
                        <button
                            onClick={(e) => handlePrevClick(e)}
                            className="absolute top-1/2 left-1 transform -translate-y-1/2 text-white bg-black bg-opacity-50 p-2 rounded-full"
                        >
                            <ArrowLeft />
                        </button>
                        <button
                            onClick={(e) => handleNextClick(e)}
                            className="absolute top-1/2 right-1 transform -translate-y-1/2 text-white bg-black bg-opacity-50 p-2 rounded-full"
                        >
                            <ArrowRight />
                        </button>
                    </>
                )}
                {entry.images.length > 1 && (
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
                        {entry.images.map((_, index) => (
                            <div key={index} className={`w-2 h-2 rounded-full ${index === currentImageIndex ? 'bg-white' : 'bg-gray-500'}`}></div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DiaryEntryCard;
