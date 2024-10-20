// Импортируйте тип RootState из вашего store
import { DiaryEntry, Tag } from '@/modules/diary/types/diary';
import { api } from '@/app/api/apiSlice';
import { io } from 'socket.io-client';
import { SortOption } from '@/modules/filters/model/types/filter';

// Определите ваш API
const diaryApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getAllDiaryEntries: builder.query<DiaryEntry[], { tags: string[]; sources: string[]; strict: boolean; sort: SortOption }>({
            query: ({ tags, sources, strict, sort }) => ({
                url: 'diaryEntries/getAllDiaryEntries',
                params: {
                    tags: tags.join(','),
                    sources: sources.join(','),
                    strict: strict,
                    sortField: sort.field,
                    sortOrder: sort.order,
                },
            }),
            async onCacheEntryAdded(arg, { updateCachedData, cacheDataLoaded, cacheEntryRemoved }) {
                const socket = io('http://localhost:3500');

                await cacheDataLoaded;

                socket.on('updateEntries', (newEntry: DiaryEntry) => {
                    updateCachedData((draft) => {
                        if (
                            (arg.tags.length === 0 ||
                                (arg.strict && arg.tags.every((tagId) => newEntry.tags.some((tag) => tag._id === tagId))) ||
                                (!arg.strict && arg.tags.some((tagId) => newEntry.tags.some((tag) => tag._id === tagId)))) &&
                            (arg.sources.length === 0 || arg.sources.includes(newEntry.forward_origin?.type || ''))
                        ) {
                            draft.unshift(newEntry);
                        }
                    });
                });

                socket.on('updateTags', (data: { tag: Tag; entryId: string }) => {
                    const { tag, entryId } = data;

                    updateCachedData((draft) => {
                        const entry = draft.find((e) => e._id === entryId);
                        if (entry) {
                            entry.tags.push(tag);
                        }
                    });
                });

                await cacheEntryRemoved;
                socket.disconnect();
            },
            providesTags: ['DiaryEntry'],
        }),
        getDiaryEntryById: builder.query({
            query: (id) => ({
                url: `diaryEntries/${id}`,
            }),

            providesTags: ['DiaryEntry'],
        }),
        deleteDiaryEntry: builder.mutation({
            query: (id: string) => ({
                url: `diaryEntries/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['DiaryEntry'],
        }),
        updateDiaryEntry: builder.mutation({
            query: ({ id, data }) => ({
                url: `diaryEntries/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['DiaryEntry'],
            async onQueryStarted({ id, data }, { dispatch, queryFulfilled }) {
               
                // Определяем аргументы, используемые в useGetAllDiaryEntriesQuery
                const args = {
                    tags: [],
                    sources: [],
                    strict: false,
                    sort: { field: 'date', order: 'desc' },
                };

                // Оптимистическое обновление кэша
                const patchResult = dispatch(
                    api.util.updateQueryData('getAllDiaryEntries', args, (draft: any) => {
         
                        const index = draft.findIndex((entry: any) => entry._id === id);
                   

                        if (index !== -1) {
                            // Обновляем запись напрямую
                            draft[index] = {
                                ...draft[index],
                                ...data,
                            };
                        }
                    })
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                }
            },
        }),

        uploadImage: builder.mutation({
            query: ({ id, data }) => ({
                url: `diaryEntries/${id}/images`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['DiaryEntry'],
        }),
        deleteImage: builder.mutation({
            query: ({ id, imageId }) => ({
                url: `diaryEntries/${id}/images/${imageId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['DiaryEntry'],
        }),
        getAllTags: builder.query({
            query: () => 'diaryFilters/getAllTags',
            providesTags: ['Tags'],
        }),
        createDiaryTag: builder.mutation({
            query: ({ id, data }) => ({
                url: `diaryFilters/${id}`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Tags', 'DiaryEntry'],
            // async onQueryStarted({ id, data }, { dispatch, queryFulfilled, getState }) {},
        }),
        deleteDiaryTag: builder.mutation({
            query: ({ id, data }) => ({
                url: `diaryFilters/${id}`,
                method: 'DELETE',
                body: data,
            }),
            invalidatesTags: ['Tags', 'DiaryEntry'],
            // async onQueryStarted({ id, data }, { dispatch, queryFulfilled }) {},
        }),
        getDiaryDates: builder.query({
            query: () => 'diaryEntries/getDiaryDates',
        }),
    }),
});

export const {
    useGetAllDiaryEntriesQuery,
    useGetDiaryEntryByIdQuery,
    useDeleteDiaryEntryMutation,
    useUpdateDiaryEntryMutation,
    useUploadImageMutation,
    useDeleteImageMutation,
    useGetDiaryDatesQuery,
} = diaryApi;
