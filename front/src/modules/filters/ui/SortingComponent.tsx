// src/features/sorting/SortingComponent.tsx
import React from 'react';
import { useDispatch } from 'react-redux';
import { SortField, SortOrder } from '../model/types/filter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/components/ui/select';
import { useAppSelector } from '@/app/providers/config/store';
import { setSort } from '../model/slices/filterSlice';

const SortingComponent: React.FC = () => {
    const dispatch = useDispatch();
    const currentSort = useAppSelector((state) => state.selectedTags.currentSort);

    const handleFieldChange = (field: SortField) => {
        dispatch(setSort({ ...currentSort, field }));
    };

    const handleOrderChange = (order: SortOrder) => {
        dispatch(setSort({ ...currentSort, order }));
    };

    return (
        <div className=" flex gap-5 w-[400px]">
            <Select value={currentSort.field} onValueChange={handleFieldChange}>
                
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Выберите поле сортировки" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="date">По дате создания</SelectItem>
                    <SelectItem value="name">По названию</SelectItem>
                </SelectContent>
            </Select>
            <Select value={currentSort.order} onValueChange={handleOrderChange}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Выберите порядок сортировки" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="asc">По возрастанию</SelectItem>
                    <SelectItem value="desc">По убыванию</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
};

export default SortingComponent;