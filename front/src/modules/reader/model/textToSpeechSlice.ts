import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TextToSpeechState {
  text: string;
}


const initialState: TextToSpeechState = {
  text: '',
};

const textToSpeechSlice = createSlice({
  name: 'textToSpeech',
  initialState,
  reducers: {
    setText: (state, action: PayloadAction<string>) => {
      state.text = action.payload;
    },
  },
});

export const { setText } = textToSpeechSlice.actions;
export default textToSpeechSlice.reducer;