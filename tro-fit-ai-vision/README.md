# tro-fit-ai-vision 🏋️‍♂️🩺

> **Lightweight, High-Performance Open-Source Toolkit for Real-Time Human Range of Motion (ROM) Analysis Built on MediaPipe.**

`tro-fit-ai-vision` is a production-ready computer vision library designed to translate raw human pose landmarks into actionable clinical and fitness metrics. By leveraging MediaPipe's robust tracking capabilities, this project eliminates the need for expensive hardware or complex environment setups, allowing independent developers, researchers, and digital healthcare innovators to measure joint mobility and range of motion (ROM) instantly via standard webcams.

---

## ✨ Key Features

- **Zero-Hardware Dependency:** Accurate kinematics and joint angle evaluation using a standard RGB camera or webcam.
- **Advanced ROM Calculation:** Core specialized geometry engines (`angle_calculator.py`, `rom_calculator.py`) that map spatial coordinates into clinical flexion, extension, and mobility vectors.
- **Low-Latency Architecture:** Optimized for real-time edge computing, client-side web browser processing, and lightweight mobile integrations.
- **Developer-Friendly Utilities:** Pre-configured modular testing pipelines (`mediapipe_webcam.py`, `pose_test.py`) for rapid onboarding and prototyping.

---

## 🛠️ Repository Structure

```text
├── models/                  # Pre-trained MediaPipe task files (.task)
├── requirements.txt         # Project runtime dependencies
└── src/
    └── vision_ai/
        ├── benchmark/       # Low-latency camera inference and webcam test scripts
        ├── img_test/        # Multi-frame image validation datasets
        ├── media_pipe_test/ # Raw pose landmark extraction and generator modules
        └── rom_prototype/   # Spatial angle & Range of Motion core math engines
