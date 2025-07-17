/* eslint-disable prettier/prettier */
import Tts from 'react-native-tts';

export const speak = (text) => {
  Tts.speak(text);
};
