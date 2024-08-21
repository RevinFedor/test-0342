import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '@/app/providers/config/store';
import { setAvailableTags, setAvailableSources, resetAllFilters } from '../model/slices/filterSlice';
import { useGetAllTagsQuery } from '../../diary/api/tagApi';
import { Button } from '@/shared/ui/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import TagsFilter from './TagsFilter';
import SourceFilter from './SourceFilter';
import SelectedFilters from './SelectedFilters';
import LoadingSkeleton from './LoadingSkeleton';

const DiaryFilters: React.FC = () => {
    const { data: allTags, error, isLoading } = useGetAllTagsQuery({});
    const dispatch = useDispatch();
    const { selectedTagIds, selectedSources } = useAppSelector((state) => state.selectedTags);

    useEffect(() => {
        fetchAvailableFilters(selectedTagIds, selectedSources);
    }, [selectedTagIds, selectedSources]);

    const fetchAvailableFilters = async (tags: string[], sources: string[]) => {
        const response = await fetch('http://localhost:3500/api/diaryEntries/getAvailableFilters', {
            method: 'POST',
            body: JSON.stringify({ tags, sources }),
            headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        dispatch(setAvailableTags(data.availableTags));
        dispatch(setAvailableSources(data.availableSources));
    };

    const handleResetAllFilters = () => {
        dispatch(resetAllFilters());
    };

    if (isLoading) return <LoadingSkeleton />;
    if (error) return <p>Error: {error.toString()}</p>;

    return (
        <div className="space-y-4">
            <div className="flex gap-5">
                <TagsFilter allTags={allTags} />
                <SourceFilter />
                <Button
                    variant="ghost"
                    onClick={handleResetAllFilters}
                    className="ml-auto"
                    disabled={selectedTagIds.length === 0 && selectedSources.length === 0}
                >
                    <RefreshCcw />
                </Button>
            </div>
            <SelectedFilters allTags={allTags} />
        </div>
    );
};

export default DiaryFilters;
