# Technical Clarifications for Project Lead

**Project:** IoT-Based Water Level Detection System  
**Prepared by:** Full-Stack IoT Engineering Team  
**Status:** Initial-Phase MVP Completed (Software Emulation & Verification Mode)  

---

To transition this MVP from the current verified software emulation baseline into physical hardware integration and production deployment, please provide technical clarification on the following items:

---

### 1. Bluetooth Low Energy (BLE) Hardware & GATT Specification
- **Target Peripheral Hardware:** What is the exact BLE SoC or module in use (e.g. Nordic nRF52840, Silicon Labs EFR32, ESP32-WROOM, or standalone transparent serial module)?
- **GATT Service & Characteristic UUIDs:** What are the official 128-bit vendor service and characteristic UUIDs for telemetry streaming (Notify) and sensor configuration (Write)?
- **Connection Security & Pairing:** Does the device require PIN bonding, Just Works pairing, or unauthenticated open advertising?

### 2. Verified BLE Binary Payload Specification
- **Payload Structure:** What is the official byte-by-byte encoding scheme produced by the gateway firmware?
- **Data Types & Scaling:** What are the exact field offsets, endianness (Little vs. Big), units (mm vs. cm), signedness, and scaling factors?
- **Checksum / Integrity:** What checksum or CRC algorithm is implemented in the peripheral firmware (e.g. CRC-8, CRC-16-CCITT, Fletcher, or sum)?
- **Sample Hardware Captures:** Can you provide 3 to 5 sample raw hexadecimal byte captures from a physical device for regression testing?

### 3. Acconeer A121 Hardware & Firmware Configuration
- **Hardware Interface:** Is the A121 sensor mounted on an Acconeer XE121 EVK, or a custom PCB? How is it interfaced to the MCU (SPI pinout, clock speed, interrupt lines)?
- **Acconeer RSS Version:** Which version of the Acconeer RSS (Radar System Software) C-library is flashed onto the host MCU (e.g. v1.4.0, v1.8.0)?
- **Official Sensor Profile:** Which radar profile (1 to 5), Pulse Repetition Frequency (PRF), and HWAAS averaging count are designated for this tank geometry?
- **Power Mode:** Is the radar configured for continuous sweep or duty-cycled pulse measurements with deep-sleep intervals?

### 4. Tank Geometry & Calibration References
- **Physical Mounting Offset:** What is the precise distance ($m$) from the Acconeer sensor horn face to the tank bottom and maximum liquid overflow level?
- **Sensor Deadzone Compensation:** What is the minimum deadzone / blind spot allowance for the selected lens/radome (default assumption: 0.05m)?
- **Alarm Thresholds:** Are the 85% (High Water Alert) and 20% (Low Water Alert) limits fixed, or should they be configurable dynamically per tank?

### 5. GPS / GNSS Location Provider
- **Hardware Availability:** Is there an onboard GNSS module (e.g. u-blox MAX-M10S, Quectel L76) streaming NMEA-0183 sentences via UART, or is location provided via cellular cell-tower triangulation or static site surveying?
- **Update Frequency:** How often should GPS fixes be refreshed, and should stationary nodes sleep the GNSS receiver to conserve battery?

### 6. MQTT Broker & Production Messaging
- **Broker Endpoint:** What is the target production MQTT broker URL/hostname and port (e.g. AWS IoT Core, EMQX, HiveMQ, or internal Mosquitto)?
- **Security & TLS:** Are MQTTS (TLS 1.3), X.509 client certificates, or username/password authentication required?
- **Topic Hierarchy:** Please confirm the final topic naming scheme (current default: `growthtech/iot/water-level/{device_id}/telemetry`).
- **QoS Level:** Is QoS 1 (At least once) approved for field telemetry?

### 7. Elasticsearch Cloud Integration
- **Cluster Details:** What is the production Elasticsearch / OpenSearch cluster URL and authentication mechanism (API Key, Basic Auth, or IAM role)?
- **Index Lifecycle Management (ILM):** What rollover and retention policies are required for the `iot-telemetry-water-level` time-series index?
- **Direct vs. Pipeline Ingestion:** Should the backend Node service index directly via `@elastic/elasticsearch`, or publish to Logstash / Kafka first?

### 8. Approved Git Repository & Governance
- **Company Repository:** Please confirm the official organization repository URL and access credentials for code push.
- **Branching Policy:** Should commits land directly on `main` or through a feature branch / pull request (`feat/initial-mvp`)?
