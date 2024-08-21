import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '@/app/providers/config/store';
import { toggleTag, toggleStrictFiltering } from '../model/slices/filterSlice';
import { Badge } from '@/shared/ui/components/ui/badge';
import { Label } from '@/shared/ui/components/ui/label';
import { Switch } from '@/shared/ui/components/ui/switch';
import { Button } from '@/shared/ui/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/components/ui/popover';
import { Tag } from '@/modules/diary/types/diary';

interface TagsFilterProps {
    allTags: Tag[];
}

const TagsFilter: React.FC<TagsFilterProps> = ({ allTags }) => {
    const dispatch = useDispatch();
    const { selectedTagIds, isStrictFiltering, availableTags } = useAppSelector((state) => state.selectedTags);
    const [openPopover, setOpenPopover] = useState(false);

    const handleOpenChange = (isOpen: boolean) => {
        setOpenPopover(isOpen);
    };

    const handlePickFilter = (id: string) => {
        dispatch(toggleTag(id));
    };

    const handleToggleStrictFiltering = () => {
        dispatch(toggleStrictFiltering());
    };


    return (
        <Popover open={openPopover} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button variant="outline" onMouseEnter={() => handleOpenChange(true)}>
                    Tag filters
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[980px] rounded-xl"
                align="start"
                onMouseEnter={() => handleOpenChange(true)}
                onMouseLeave={() => handleOpenChange(false)}
            >
                <div className="flex gap-5 flex-wrap">
                    {allTags?.map((tag: Tag) => (
                        <Badge
                            key={tag._id}
                            variant="secondary"
                            className={`
                                cursor-pointer text-[16px] transition-colors duration-200
                                ${!availableTags.includes(tag._id) ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                            style={{
                                backgroundColor: selectedTagIds.includes(tag._id) ? 'rgb(129 140 248)' : 'transparent',
                            }}
                            onClick={() => availableTags.includes(tag._id) && handlePickFilter(tag._id)}
                        >
                            {tag.name}
                        </Badge>
                    ))}
                </div>
                <div className={'flex items-center space-x-2 outline-none mt-5'}>
                    <Switch id="strict-filtering" checked={isStrictFiltering} onCheckedChange={handleToggleStrictFiltering} />
                    <Label htmlFor="strict-filtering">Strict Filters</Label>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default TagsFilter;