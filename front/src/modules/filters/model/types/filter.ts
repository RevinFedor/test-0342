// Define the shape of a tag
export interface Tag {
    _id: string;
    name: string;
}

// Define all possible source types and subtypes
export type SourceType = keyof typeof SOURCE_TYPES;
export type SourceSubtype = (typeof FLAT_SOURCE_TYPES)[number];

// Define a discriminated union for filters
export type Filter = { type: 'tag'; id: string; value: string } | { type: 'source'; id: string; value: SourceSubtype };

// Define the state shape for the filter slice
export interface FilterState {
    selectedFilters: Filter[];
    isStrictFiltering: boolean;
    availableFilters: {
        tags: Tag[];
        sources: SourceSubtype[];
    }; 
}

// Helper type for actions that toggle filters
export type ToggleFilterPayload = { type: 'tag'; id: string; value: string } | { type: 'source'; id: string; value: SourceSubtype };

// Define the shape of the forward origin
export interface ForwardOrigin {
    type: SourceType;
    subtype?: SourceSubtype;
    title?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    isHidden?: boolean;
    channelId?: string;
    userId?: string;
}

// constants.ts (you might want to move this to a separate file if it's not already)
export const SOURCE_TYPES = {
    TELEGRAM: 'telegram',
    DIARY: 'diary',
    EDITOR: 'editor',
} as const;

export const SOURCE_SUBTYPES = {
    [SOURCE_TYPES.TELEGRAM]: ['all', 'channel', 'user', 'hidden_user'],
    [SOURCE_TYPES.DIARY]: ['diary'],
    [SOURCE_TYPES.EDITOR]: ['editor'],
} as const;

export const FLAT_SOURCE_TYPES = Object.values(SOURCE_TYPES).reduce((acc, type) => {
    return [...acc, type, ...SOURCE_SUBTYPES[type as keyof typeof SOURCE_SUBTYPES]];
}, [] as string[]);



export type SortField = 'name' | 'date' | 'age';
export type SortOrder = 'asc' | 'desc';

export interface SortOption {
  field: SortField;
  order: SortOrder;
}