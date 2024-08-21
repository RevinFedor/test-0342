import { api } from '@/app/api/apiSlice';

const tagApi = api.injectEndpoints({
    endpoints: (builder) => ({
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
    }),
});

export const { useGetAllTagsQuery, useCreateDiaryTagMutation, useDeleteDiaryTagMutation } = tagApi;
