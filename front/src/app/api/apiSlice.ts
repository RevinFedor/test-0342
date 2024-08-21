import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
    baseUrl: 'http://localhost:3500/api/',
});

export const api = createApi({
    reducerPath: 'api',
    tagTypes: ['DiaryEntry', 'Tags','Books'],
    baseQuery: baseQuery,
    endpoints: (builder) => ({}),
});
