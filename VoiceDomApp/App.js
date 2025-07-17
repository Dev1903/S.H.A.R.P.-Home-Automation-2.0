import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
  Easing,
} from 'react-native';
import {startWakeWordDetection} from './utils/porcupineManager';
import {startRecording, stopRecording} from './utils/recorder';
import {speak} from './utils/tts';
import {sendToServer} from './utils/server';
import Icon from 'react-native-vector-icons/Ionicons';

const AnimatedDot = ({index}) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.5,
          duration: 400,
          delay: index * 150,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          transform: [{scale}],
        },
      ]}
    />
  );
};

export default function App() {
  const [messages, setMessages] = useState([]);
  const [recording, setRecording] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [fan, setFan] = useState(false);
  const [light, setLight] = useState(false);
  const [lamp, setLamp] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  const porcupineManagerRef = useRef(null);
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (fan) {
      Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.linear,
        }),
      ).start();
    } else {
      rotation.stopAnimation();
      rotation.setValue(0);
    }
  }, [fan]);

  const fetchDeviceStates = async () => {
    try {
      const res = await fetch(
        'https://blr1.blynk.cloud/external/api/get?token=NiOh2gK2WEkE3Wzwp9lbECjJvPGeDNhr&V0&V1&V2',
      );
      const states = await res.json();
      setFan(states.V0 === 1);
      setLight(states.V1 === 1);
      setLamp(states.V2 === 1);
    } catch (err) {
      console.error('Failed to fetch device states:', err);
    }
  };

  const addMessage = msg => {
    console.log(msg);
    setMessages(prev => [...prev, msg]);
  };

  const toggleDevice = async (device, stateSetter, currentState) => {
    const value = currentState ? 0 : 1;
    const url = `https://blr1.blynk.cloud/external/api/update?token=NiOh2gK2WEkE3Wzwp9lbECjJvPGeDNhr&${device}=${value}`;
    try {
      await fetch(url);
      stateSetter(!currentState);
    } catch (e) {
      console.log('Toggle failed:', e);
    }
  };

  const handleRecord = async () => {
    if (recording) return;
    setShowPopup(true);
    speak('Hey!! I am listening');
    addMessage('🎙️ Started recording');
    setRecording(true);

    try {
      await porcupineManagerRef.current?.delete();

      const audioPath = await startRecording();

      setTimeout(async () => {
        addMessage('⏱️ Auto-stopping after 5s...');
        const stoppedPath = await stopRecording();
        setRecording(false);
        setShowPopup(false);

        try {
          const data = await sendToServer(stoppedPath);
          if (data.transcription) addMessage(`🗣️ You: ${data.transcription}`);
          if (data.reply) {
            addMessage(`🤖 ${data.reply}`);
            speak(data.reply);
            fetchDeviceStates();
          }
        } catch (err) {
          console.error(err);
          addMessage('⚠️ Error communicating with server.');
        } finally {
          const manager = await startWakeWordDetection(
            handleRecord,
            addMessage,
          );
          porcupineManagerRef.current = manager;
        }
      }, 5000);
    } catch (err) {
      console.error('🎤 Recording error:', err);
      setRecording(false);
      setShowPopup(false);
      addMessage('❌ Failed to start recording');

      const manager = await startWakeWordDetection(handleRecord, addMessage);
      porcupineManagerRef.current = manager;
    }
  };

  const restartWakeWord = async () => {
    if (restarting) return;
    setRestarting(true);
    addMessage('🔄 Restarting voice assistant...');
    progress.setValue(0);

    Animated.timing(progress, {
      toValue: 100,
      duration: 2500,
      useNativeDriver: false,
      easing: Easing.linear,
    }).start(async () => {
      try {
        await porcupineManagerRef.current?.delete();
        const manager = await startWakeWordDetection(handleRecord, addMessage);
        porcupineManagerRef.current = manager;
        addMessage('✅ Voice assistant restarted successfully!');
      } catch (err) {
        console.error('Restart failed:', err);
        addMessage('❌ Restart failed.');
      }
      setRestarting(false);
    });
  };

  useEffect(() => {
    const initWakeWord = async () => {
      try {
        const manager = await startWakeWordDetection(handleRecord, addMessage);
        porcupineManagerRef.current = manager;
      } catch (err) {
        console.error('❌ Porcupine startup failed:', err);
      }
    };

    initWakeWord();
    fetchDeviceStates();

    return () => {
      porcupineManagerRef.current?.delete();
      console.log('🛑 Porcupine stopped');
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🏠 VoiceDom</Text>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Icon name="ellipsis-vertical" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Device Switches */}
      <View style={styles.switchContainer}>
        <TouchableOpacity onPress={() => toggleDevice('V1', setLight, light)}>
          <View style={styles.deviceRow}>
            <Text style={styles.label}>💡 Light</Text>
            <Icon
              name={light ? 'bulb' : 'bulb-outline'}
              size={30}
              color={light ? '#ffd700' : '#8b949e'}
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => toggleDevice('V0', setFan, fan)}>
          <View style={styles.deviceRow}>
            <Text style={styles.label}>🌀 Fan</Text>
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: rotation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              }}>
              <Icon
                name="aperture"
                size={30}
                color={fan ? '#00ffff' : '#8b949e'}
              />
            </Animated.View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => toggleDevice('V2', setLamp, lamp)}>
          <View style={styles.deviceRow}>
            <Text style={styles.label}>🛏️ Lamp</Text>
            <Icon
              name={lamp ? 'bed' : 'bed-outline'}
              size={30}
              color={lamp ? '#ffa07a' : '#8b949e'}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Wake Word Popup */}
      <Modal transparent visible={showPopup} animationType="fade">
        <View style={styles.popupOverlay}>
          <View style={styles.popupEnhanced}>
            <Text style={styles.popupTitle}>🎧 Listening...</Text>
            <View style={styles.dotsContainer}>
              {[...Array(3)].map((_, i) => (
                <AnimatedDot key={i} index={i} />
              ))}
            </View>
            <Text style={styles.popupSubtitle}>Say your command now</Text>
          </View>
        </View>
      </Modal>

      {/* Message Panel */}
      <Modal visible={menuVisible} animationType="slide">
        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>💬 Assistant Messages</Text>
          <ScrollView style={styles.menuScroll}>
            {messages.map((msg, idx) => (
              <Text key={idx} style={styles.msg}>
                {msg}
              </Text>
            ))}
          </ScrollView>
          <Pressable
            onPress={() => setMenuVisible(false)}
            style={styles.closeButton}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>
      </Modal>

      {/* Debug Console */}
      <View style={styles.debugPanel}>
        <ScrollView
          style={styles.debugScroll}
          showsVerticalScrollIndicator={false}>
          {messages.slice(-3).map((msg, idx) => (
            <Text key={idx} style={styles.debugText}>
              {msg}
            </Text>
          ))}
        </ScrollView>
      </View>

      {/* Restart Button */}
      <TouchableOpacity style={styles.restartButton} onPress={restartWakeWord}>
        {restarting ? (
          <View style={styles.hackerBox}>
            <Text style={styles.hackerText}>🧠 Reinitializing AI...</Text>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progress.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          </View>
        ) : (
          <Icon name="refresh" size={28} color="white" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0d1117', paddingTop: 60},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {fontSize: 24, fontWeight: 'bold', color: '#58a6ff'},
  switchContainer: {marginTop: 30, paddingHorizontal: 20},
  deviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    backgroundColor: '#161b22',
    padding: 15,
    borderRadius: 12,
  },
  label: {fontSize: 18, color: '#c9d1d9'},
  msg: {marginBottom: 10, fontSize: 16, color: '#8b949e'},
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupEnhanced: {
    backgroundColor: '#1f6feb',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#58a6ff',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  popupTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  popupSubtitle: {fontSize: 16, color: '#dbe9ff', marginTop: 15},
  dotsContainer: {flexDirection: 'row', marginTop: 10},
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    marginHorizontal: 5,
  },
  menuContainer: {
    flex: 1,
    backgroundColor: '#0d1117',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  menuTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#58a6ff',
    marginBottom: 20,
    textAlign: 'center',
  },
  menuScroll: {flex: 1},
  closeButton: {
    padding: 15,
    backgroundColor: '#161b22',
    borderRadius: 10,
    marginVertical: 20,
  },
  closeText: {
    textAlign: 'center',
    color: '#58a6ff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  debugPanel: {
    height: 70,
    backgroundColor: '#161b22',
    paddingHorizontal: 10,
    paddingTop: 5,
    borderTopColor: '#30363d',
    borderTopWidth: 1,
  },
  debugScroll: {flexGrow: 1},
  debugText: {fontSize: 12, color: '#8b949e', marginBottom: 2},

  restartButton: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: '#238636',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  hackerBox: {
    width: 200,
    backgroundColor: '#0d1117',
    padding: 10,
    borderRadius: 12,
  },
  hackerText: {
    color: '#00ff99',
    fontSize: 13,
    marginBottom: 6,
    fontFamily: 'monospace',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#2e2e2e',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: '#00ff99',
  },
});
