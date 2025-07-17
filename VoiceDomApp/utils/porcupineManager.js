/* eslint-disable prettier/prettier */
import {PorcupineManager} from '@picovoice/porcupine-react-native';

const accessKey = '<ADD YOU ACCESS KEY FROM PICO VOICE CONSOLE>';

const keywordPaths = [
  'hey_sharp.ppn', // index 0 CUSTOM PPN FILE U CAN DOWNLOAD ONE FROM PICO VOICE CONSOLE WAKE WORD AND ADD TO ANDROID'S ASSETS FOLDER
  'porcupine.ppn', // index 1
  'bumblebee.ppn', // index 2
];

const keywordLabels = ['hey_sharp', 'porcupine', 'bumblebee'];

/**
 * Initializes and starts Porcupine wake word detection.
 * Calls `onWakeWord(keywordLabel)` when a keyword is detected.
 */
export const startWakeWordDetection = async (onWakeWord, onLog) => {
  try {
    const manager = await PorcupineManager.fromKeywordPaths(
      accessKey,
      keywordPaths,
      async keywordIndex => {
        const keyword = keywordLabels[keywordIndex] || 'unknown';
        onLog?.(`🎯 Wake word detected: "${keyword}"`);
        await onWakeWord(keyword);
      },
    );
    await manager.start();
    onLog?.('✅ Porcupine wake word detection started');
    return manager;
  } catch (err) {
    onLog?.(`❌ Porcupine init failed: ${err.message}`);
    throw err;
  }
};
