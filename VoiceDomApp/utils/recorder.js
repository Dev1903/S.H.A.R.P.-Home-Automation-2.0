/* eslint-disable prettier/prettier */
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';

const audioPath = `${RNFS.DocumentDirectoryPath}/voice.m4a`;
const recorder = new AudioRecorderPlayer();

export const startRecording = async () => {
  try {
    await recorder.startRecorder(audioPath);
    return audioPath;
  } catch (error) {
    console.log('Start recording error', error);
    throw error;
  }
};

export const stopRecording = async () => {
  try {
    await recorder.stopRecorder();
    return audioPath;
  } catch (error) {
    console.error('Stop recording error:', error);
    throw error;
  }
};
