import { ReducersMapObject, configureStore } from '@reduxjs/toolkit';

import { api } from '@/app/api/apiSlice';
import tagsSlice, { SelectedTagsState } from '@/modules/filters/model/slices/filterSlice';
import { TypedUseSelectorHook } from 'react-redux';
import { useDispatch, useSelector } from 'react-redux';
import textToSpeechSlice, { TextToSpeechState } from '@/modules/reader/model/textToSpeechSlice';

export interface StateSchema {
    [api.reducerPath]: ReturnType<typeof api.reducer>;
    selectedTags: SelectedTagsState;
    textToSpeech: TextToSpeechState;
}

export function createReduxStore() {
    const rootReducers: ReducersMapObject<StateSchema> = {
        [api.reducerPath]: api.reducer,
        selectedTags: tagsSlice,
        textToSpeech: textToSpeechSlice,
    };

    const store = configureStore({
        reducer: rootReducers,
        // devTools: import.meta.env.VITE_IS_DEV,
        devTools: true,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                thunk: {
                    extraArgument: { api },
                },
                 serializableCheck: false
            }).concat(api.middleware),
    });

    return store;
}

//! Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof createReduxStore.prototype.getState>;
//! Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = ReturnType<typeof createReduxStore.prototype.dispatch>;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
