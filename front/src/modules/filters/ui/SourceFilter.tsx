import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '@/app/providers/config/store';
import { toggleSource } from '../model/slices/filterSlice';
import { Button } from '@/shared/ui/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/components/ui/popover';
import { SOURCE_TYPES, SOURCE_SUBTYPES } from '../model/types/filter';

const SourceFilter: React.FC = () => {
    const dispatch = useDispatch();
    const { selectedSources, availableSources } = useAppSelector((state) => state.selectedTags);
    const [openPopover, setOpenPopover] = useState(false);
    const [showSubtypes, setShowSubtypes] = useState<string | null>(null);

    const handleOpenChange = (isOpen: boolean) => {
        setOpenPopover(isOpen);
        if (!isOpen) {
            setShowSubtypes(null);
        }
    };

    const handlePickFilter = (id: string) => {
        dispatch(toggleSource(id));
    };

    return (
        <Popover open={openPopover} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="outline-none" onMouseEnter={() => handleOpenChange(true)}>
                    Source
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[580px] rounded-xl"
                align="start"
                onMouseEnter={() => handleOpenChange(true)}
                onMouseLeave={() => handleOpenChange(false)}
            >
                <div className="flex gap-5">
                    {Object.entries(SOURCE_TYPES).map(([key, value]) => (
                        <div key={key} className="relative">
                            <Button
                                variant="outline"
                                onClick={() => availableSources.includes(value) && handlePickFilter(value)}
                                onMouseEnter={() => setShowSubtypes(value)}
                                className={`w-full ${!availableSources.includes(value) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                style={{
                                    backgroundColor: selectedSources.includes(value) ? 'rgb(129 140 248)' : 'transparent',
                                }}
                            >
                                {key}
                            </Button>
                            {value === SOURCE_TYPES.TELEGRAM && showSubtypes === value && SOURCE_SUBTYPES[value].length > 0 && (
                                <div
                                    className="absolute top-full left-0 mt-1 w-full border-none border rounded-md shadow-lg"
                                    onMouseEnter={() => setShowSubtypes(value)}
                                    onMouseLeave={() => setShowSubtypes(null)}
                                >
                                    {SOURCE_SUBTYPES[value].map((subtype) => (
                                        <Button
                                            key={subtype}
                                            onClick={() => handlePickFilter(subtype)}
                                            className={`w-full justify-start ${
                                                !availableSources.includes(subtype) && subtype !== 'all'
                                                    ? 'opacity-50 cursor-not-allowed'
                                                    : ''
                                            }`}
                                            style={{
                                                backgroundColor: selectedSources.includes(subtype) ? 'rgb(129 140 248)' : 'black',
                                                color: 'white',
                                            }}
                                            disabled={!availableSources.includes(subtype) && subtype !== 'all'}
                                        >
                                            {subtype}
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default SourceFilter;