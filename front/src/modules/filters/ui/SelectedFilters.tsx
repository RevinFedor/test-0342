import React from 'react';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '@/app/providers/config/store';
import { toggleTag, toggleSource } from '../model/slices/filterSlice';
import { Badge } from '@/shared/ui/components/ui/badge';
import { Tag } from '@/modules/diary/types/diary';

interface SelectedFiltersProps {
    allTags: Tag[];
}

const SelectedFilters: React.FC<SelectedFiltersProps> = ({ allTags }) => {
    const dispatch = useDispatch();
    const { selectedTagIds, selectedSources } = useAppSelector((state) => state.selectedTags);

    const handlePickFilter = (type: 'tag' | 'source', id: string) => {
        if (type === 'tag') {
            dispatch(toggleTag(id));
        } else {
            dispatch(toggleSource(id));
        }
    };

    return (
        <div className="flex flex-wrap gap-2">
            {selectedTagIds.map((tagId: string) => {
                const tag = allTags?.find((t: Tag) => t._id === tagId);
                return (
                    <Badge key={tagId} variant="secondary" className="cursor-pointer" onClick={() => handlePickFilter('tag', tagId)}>
                        {tag?.name} ✕
                    </Badge>
                );
            })}
            {selectedSources.map((source: string) => (
                <Badge key={source} variant="secondary" className="cursor-pointer" onClick={() => handlePickFilter('source', source)}>
                    {source} ✕
                </Badge>
            ))}
        </div>
    );
};

export default SelectedFilters;