import React, { useEffect, useState } from 'react';
import { useDeleteDiaryEntryMutation, useGetAllDiaryEntriesQuery, useUpdateDiaryEntryMutation } from '../api/diaryApi';
import { DiaryEntry } from '../types/diary';
import DiaryModal from './diary-modal/DiaryModal';
import DiaryList from './diary-list/DiaryList';
import DiaryFilters from '../../filters/ui/DiaryFilters';
import { useDispatch } from 'react-redux';
import { setAvailableTags, setAvailableSources, toggleTag, toggleSource, toggleStrictFiltering } from '../../filters/model/slices/filterSlice';
import { useSearchParams } from 'react-router-dom';
import { useAppSelector } from '@/app/providers/config/store';
import SortingComponent from '@/modules/filters/ui/SortingComponent';

const Diary: React.FC = () => {
    const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const dispatch = useDispatch();

    const selectedTagIds = useAppSelector((state) => state.selectedTags.selectedTagIds);
    const selectedSources = useAppSelector((state) => state.selectedTags.selectedSources);
    const isStrictFiltering = useAppSelector((state) => state.selectedTags.isStrictFiltering);
    const currentSort = useAppSelector((state) => state.selectedTags.currentSort);

    useEffect(() => {
        const tagsFromUrl = searchParams.get('tags')?.split(',') || [];
        const sourcesFromUrl = searchParams.get('sources')?.split(',') || [];
        const strictFromUrl = searchParams.get('strict') === 'true';

        tagsFromUrl.forEach((tag) => dispatch(toggleTag(tag)));
        sourcesFromUrl.forEach((source) => dispatch(toggleSource(source)));
        if (strictFromUrl) dispatch(toggleStrictFiltering());
    }, []);

    useEffect(() => {
        const newSearchParams = new URLSearchParams();
        if (selectedTagIds.length > 0) {
            newSearchParams.set('tags', selectedTagIds.join(','));
        }
        if (selectedSources.length > 0) {
            newSearchParams.set('sources', selectedSources.join(','));
        }
        if (isStrictFiltering) {
            newSearchParams.set('strict', 'true');
        }
        newSearchParams.set('sortField', currentSort.field);
        newSearchParams.set('sortOrder', currentSort.order);
        setSearchParams(newSearchParams);
    }, [selectedTagIds, selectedSources, isStrictFiltering, currentSort]);

    const {
        data: diaryEntries,
        error,
        isLoading,
    } = useGetAllDiaryEntriesQuery({
        tags: selectedTagIds,
        sources: selectedSources,
        strict: isStrictFiltering,
        sort: currentSort,
    });

    const [deleteDiaryEntry] = useDeleteDiaryEntryMutation();
    const [updateDiaryEntry] = useUpdateDiaryEntryMutation();

    // useEffect(() => {
    //     if (diaryEntries) {
    //         // Обновляем доступные фильтры на основе полученных данных
    //         const availableTags = Array.from(new Set(diaryEntries.flatMap((entry) => entry.tags.map((tag) => tag._id))));
    //         const availableSources = Array.from(
    //             new Set(diaryEntries.map((entry) => entry.forward_origin?.type || entry.forward_origin?.subtype).filter(Boolean))
    //         );

    //         dispatch(setAvailableTags(availableTags));

    //         setSelectedEntry(diaryEntries.find((el: DiaryEntry) => selectedEntry?._id === el._id) || null);
    //     }
    // }, [diaryEntries]);

    const handleDelete = async (id: string) => {
        try {
            await deleteDiaryEntry(id).unwrap();
            setIsOpen(false);
        } catch (error) {
            console.error('Failed to delete diary entry:', error);
        }
    };

    const handleUpdate = async (id: string, data: Partial<DiaryEntry>) => {
        try {
            await updateDiaryEntry({
                id,
                data,
            }).unwrap();

            // Обновляем локальный selectedEntry, чтобы изменения отобразились сразу в модальном окне
            setSelectedEntry((prev) => (prev ? { ...prev, ...data } : null));
        } catch (error) {
            console.error('Failed to update diary entry:', error);
        }
    };

    if (error) return <p>Error: {error.toString()}</p>;

    const handleEntryClick = (entry: DiaryEntry) => {
        setSelectedEntry(entry);
        setIsOpen(!isOpen);
    };

    return (
        <div className="container mx-auto p-4 flex flex-col items-start">
            <div className="w-full mb-6  flex justify-between items-start">
                <DiaryFilters />
                <SortingComponent />
            </div>

            <div className="w-full">
                <DiaryList
                    diaryEntries={diaryEntries || []}
                    onDelete={handleDelete}
                    onClick={handleEntryClick}
                    onUpdate={handleUpdate}
                    isLoading={isLoading}
                />
            </div>
            <DiaryModal
                selectedEntry={selectedEntry}
                isOpen={isOpen}
                onClose={() => {
                    setSelectedEntry(null);
                    setIsOpen(false);
                }}
                onDelete={() => selectedEntry && handleDelete(selectedEntry._id)}
                onUpdate={handleUpdate}
            />
        </div>
    );
};

export default Diary;
