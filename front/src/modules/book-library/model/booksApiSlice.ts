import { api } from '@/app/api/apiSlice';
import ePub from 'epubjs';

export interface Book {
    _id: string;
    filePath: string;
    title?: string;
    creator?: string;
    description?: string;
}

export interface ParsedBook extends Omit<Book, '_id'> {
    title: string;
    creator: string;
    description: string;
    content: ArrayBuffer;
}

export const booksApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getBooks: builder.query<Book[], void>({
            query: () => 'books',
            providesTags: ['Books'],
        }),
        uploadBook: builder.mutation<void, FormData>({
            query: (formData) => ({
                url: 'books',
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: ['Books'],
        }),
        deleteBook: builder.mutation<void, string>({
            query: (id) => ({
                url: `books/${id}`,

                method: 'DELETE',
            }),
            invalidatesTags: ['Books'],
        }),
        getBookContent: builder.query<ParsedBook, string>({
            query: (filePath) => ({
                url: 'http://localhost:3500' + filePath,
                responseHandler: (response) => response.arrayBuffer(),
            }),
            transformResponse: async (content: ArrayBuffer, _, filePath) => {
                const book = ePub(content);
                await book.ready;
                const metadata = await book.loaded.metadata;
                return {
                    title: metadata.title || 'Unknown Title',
                    creator: metadata.creator || 'Unknown Author',
                    description: metadata.description || 'No description available',
                    content,
                    filePath,
                };
            },
        }),
    }),
});

export const { useGetBooksQuery, useUploadBookMutation, useDeleteBookMutation, useGetBookContentQuery } = booksApi;
