import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SortOption } from '../types/filter';

export interface SelectedTagsState {
    selectedTagIds: string[];
    selectedSources: string[];
    isStrictFiltering: boolean;
    availableTags: string[];
    availableSources: string[];  currentSort: SortOption;
}

const initialState: SelectedTagsState = {
    selectedTagIds: [],
    selectedSources: [],
    isStrictFiltering: false,
    availableTags: [],
    availableSources: [], currentSort: { field: 'date', order: 'desc' },
};

const filterSlice = createSlice({
    name: 'selectedTags',
    initialState,
    reducers: {
        toggleTag(state, action: PayloadAction<string>) {
            const tagId = action.payload;
            if (state.selectedTagIds.includes(tagId)) {
                state.selectedTagIds = state.selectedTagIds.filter((id) => id !== tagId);
            } else {
                state.selectedTagIds.push(tagId);
            }
        },
        toggleSource(state, action: PayloadAction<string>) {
            const source = action.payload;
            if (state.selectedSources.includes(source)) {
                state.selectedSources = state.selectedSources.filter((s) => s !== source);
            } else {
                state.selectedSources.push(source);
            }
        },
        setAvailableTags(state, action: PayloadAction<string[]>) {
            state.availableTags = action.payload;
        },
        setAvailableSources(state, action: PayloadAction<string[]>) {
            state.availableSources = action.payload;
        },
        toggleStrictFiltering(state) {
            state.isStrictFiltering = !state.isStrictFiltering;
        },
        resetAllFilters: (state) => {
            state.selectedTagIds = [];
            state.selectedSources = [];
            state.isStrictFiltering = false;
            state.availableTags = [];
            state.availableSources = [];
        },setSort: (state, action: PayloadAction<SortOption>) => {
      state.currentSort = action.payload;
    },
    },
});

export const { 
    toggleTag, 
    toggleSource, 
    setAvailableTags, 
    setAvailableSources, 
    toggleStrictFiltering, 
    resetAllFilters ,setSort
} = filterSlice.actions;

export default filterSlice.reducer;