# 🎙️ SHARP — Smart Hub with Audio Recognition and Processing

> A DIY smart home assistant that listens, understands, and controls your devices — built with Python, React Native, and ESP8266.  

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python)
![React Native](https://img.shields.io/badge/React%20Native-bare--CLI-61DBFB?logo=react)
![IoT](https://img.shields.io/badge/IoT-ESP8266-orange?logo=arduino)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-Work%20in%20Progress-yellow)

---

## 🧠 Overview

**SHARP (Smart Hub with Audio Recognition and Processing)** is a personal home automation project that brings together **voice recognition**, **IoT**, and **mobile control** — all powered by open-source tools.

It lets you control household devices like fans, lights, and lamps using simple voice commands like:

> “Hey Sharp, turn on the light 💡”

Originally started while waiting for my onboarding (😅), it turned into a full-fledged IoT experiment powered by **Python**, **Whisper**, and **React Native**.

---

## ✨ Features

- 🎤 **Wake Word Detection** — Uses [Porcupine](https://picovoice.ai/platform/porcupine/) for “Hey Sharp” trigger  
- 🧠 **Speech-to-Command** — Whisper + Python backend for speech-to-text processing  
- 🔌 **IoT Control** — ESP8266 (NodeMCU) boards control physical relays (fan, light, lamp)  
- 📱 **Mobile App** — Custom React Native app (bare CLI, not Expo)  
- 💡 **OLED Display Animations** — Real-time visual feedback for actions  
- 🌐 **Remote Control** — Integrated with [Blynk](https://blynk.io/) (virtual pins V0–V2)  
- 🔇 **Silence Detection** + Real-time command updates  
- ⚙️ **Reliable Automation** with custom toggles and state sync

---

## 🧩 Tech Stack

| Layer | Technology |
|-------|-------------|
| **Voice Detection** | Porcupine |
| **Speech Processing** | Whisper (OpenAI) + Python |
| **Hardware Control** | ESP8266 (NodeMCU) + Relays |
| **Mobile Interface** | React Native (bare CLI) |
| **Cloud Connectivity** | Blynk (virtual pins V0–V2) |
| **Display** | OLED module |
| **Misc** | Jumper wires, soldering, and patience 🔥 |

---
