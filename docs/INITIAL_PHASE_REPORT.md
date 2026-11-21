# Initial Phase Project Report: IoT-Based Water Level Detection System

**Author / Role:** Full-Stack IoT Engineer  
**Project Path:** `C:\Users\LENOVO\.gemini\antigravity\scratch\iot-water-level-system`  
**Repository Branch:** `main`  
**Phase:** Initial Architecture, Verification & MVP Implementation  

---

## 1. Six Training Activities & Allocated Hours from Handbook

As specified in the company training curriculum, the project tasks are distributed across six core engineering activities with an allocated total of **9.0 hours**:

| Activity # | Activity Description | Allocated Time (Handbook) | Actual Time Spent | Completion Status |
|:---:|:---|:---:|:---:|:---:|
| **Activity 1** | **Acconeer A121 Sensor Understanding & Calibration Math**<br/>Radar geometry, RSS SDK configuration, distance-to-water calculation, and mounting parameters. | 2.0 Hours | *Not formally tracked* | **Complete (Software Model)** |
| **Activity 2** | **BLE Architecture, GATT Modeling & Custom Payload Framing**<br/>Service/characteristic mapping, peripheral discovery state machine, 12-byte binary payload serialization. | 1.5 Hours | *Not formally tracked* | **Complete (Demo Protocol)** |
| **Activity 3** | **BLE Raw Byte Decoding, Error Handling & CRC Validation**<br/>Big-endian parser, bitmask extraction, boundary checks, malformed frame and checksum rejection. | 1.0 Hour | *Not formally tracked* | **Complete (Verified by Tests)** |
| **Activity 4** | **GPS Geo-Referencing & Spatial Source Orchestration**<br/>Coordinate extraction, range boundary validation (-90°/+90°, -180°/+180°), and hardware failure/permission state handling. | 2.0 Hours | *Not formally tracked* | **Complete (Verified)** |
| **Activity 5** | **MQTT Telemetry Ingestion & Elasticsearch Storage Integration**<br/>MQTT.js pub/sub, QoS 1 delivery, cluster indexing, and offline in-memory ring-buffer fallback. | 1.5 Hours | *Not formally tracked* | **Complete (Resilient Fallback)** |
| **Activity 6** | **Full-Stack Monorepo Integration & Live React Dashboard**<br/>Express REST endpoints, real-time SVG charting, interactive payload tester, demo indicators, and verification. | 1.0 Hour | *Not formally tracked* | **Complete (Runnable MVP)** |
| **Total** | | **9.0 Hours** | *Not formally tracked* | **Phase MVP Ready** |

*Note: Actual development time was not formally tracked in a timecard management system during this initial implementation phase.*

---

## 2. Work Completed & Verifiable Evidence

### Backend Engine (Node.js + Express)
- **Sensor Data Service (`src/services/sensorDataService.js`)**: Coordinates telemetry ingestion, stores in-memory ring-buffer history (500 records), and structures telemetry according to the handbook format (`device_id`, `timestamp`, `measurement`, `location`, `source`).
- **BLE Integration Adapter (`src/services/bleAdapter.js`)**: Implements peripheral scanning, connection state machine, GATT specifications, and returns explicit `isHardwareConnected: false`.
- **BLE Payload Decoder (`src/services/bleDecoder.js`)**: 12-byte parser with endianness mapping, status bitfield extraction, and checksum verification. Explicitly documented via `getMappingDefinition()`.
- **Acconeer A121 Adapter (`src/services/acconeerA121Adapter.js`)**: Calculates water level ($h = 5.2\text{m} - d$), fluid percentage, and status alerts (`HIGH`, `LOW`, `NORMAL`). Flags all configuration as illustrative demo assumptions.
- **GPS Location Service (`src/services/gpsService.js`)**: Geo-referencing service with coordinate boundary validation and support for `UNAVAILABLE` and `PERMISSION_DENIED` states.
- **MQTT Service (`src/services/mqttService.js`)**: Pub/sub client with auto-reconnect and offline telemetry buffer.
- **Elasticsearch Service (`src/services/elasticsearchService.js`)**: Cluster indexing client with in-memory buffer fallback.
- **Realistic Sensor Simulator (`src/services/simulator.js`)**: Fluid dynamics generator outputting raw 12-byte binary frames tagged with `isDemoData: true`.

### Frontend Dashboard (React + Vite + Tailwind CSS v4)
- **Live SVG Water-Level Chart**: Real-time fluid level curve with High (85% / 4.25m) and Low (20% / 1.00m) threshold dashed reference bands and hover inspection tooltips.
- **BLE Management & Hex Analyzer**: Discovered nodes list, GATT UUID table, live 12-byte hex view with byte offsets, and an interactive hex decoder test box.
- **GPS Spatial Panel**: Validated latitude/longitude, altitude, radial accuracy, source switcher, and direct link to OpenStreetMap.
- **MQTT & Elasticsearch Monitors**: Displays connection state, message counters, payload inspection stream, and search query box.
- **Telemetry Table**: Historical readings log with filtering and CSV export.
- **Prominent Demo Mode Banner**: Alerts users that data is synthetic and physical hardware is simulated.

---

## 3. Automated Test Results

Automated tests run with Node's native test runner (`node --test`):

```text
> iot-water-level-backend@1.0.0 test
> node --test tests/bleDecoder.test.js tests/acconeerA121.test.js tests/api.test.js

TAP version 13
ok 1 - AcconeerA121Adapter - calculate water level geometry
ok 2 - API - GET /api/health returns 200 with online status and subsystems
ok 3 - API - GET /api/devices returns BLE device list with demo tags
ok 4 - API - POST /api/telemetry processes new reading in handbook structure
ok 5 - API - GET /api/location returns GPS coordinates and handles UNAVAILABLE state
ok 6 - API - GET /api/mqtt/status returns broker status
ok 7 - API - POST /api/ble/decode-hex correctly decodes valid 12-byte payload
ok 8 - BlePayloadDecoder - encode and decode roundtrip
ok 9 - BlePayloadDecoder - decode from formatted hex string
ok 10 - BlePayloadDecoder - rejects malformed payloads and short buffers
ok 11 - BlePayloadDecoder - flags invalid checksum with validation warnings
ok 12 - BlePayloadDecoder - returns complete byte mapping documentation

1..12
# tests 12
# pass 12
# fail 0
```

Frontend production build (`npm run build`):
- Compiled cleanly with **0 errors**: `dist/assets/index-Cd5h4YeE.js (223.35 kB)`, `dist/assets/index-C4Frih4N.css (41.50 kB)`.

---

## 4. Hardware & Service Status (Verified vs. Unverified)

1. **Acconeer A121 Radar (`NOT VERIFIED ON HARDWARE`)**:
   - The physical 60 GHz radar chip and SPI evaluation kit (XE121) are not physically connected.
   - All radar distances and sweep amplitude figures are software-simulated via mathematical fluid dynamics models.
2. **Native Bluetooth (BLE) Driver (`NOT VERIFIED ON HARDWARE`)**:
   - Host execution environment lacks native OS Bluetooth daemon (BlueZ/Noble) and physical BLE radio dongle.
   - BLE scanning and GATT notifications are software-emulated.
3. **Physical GNSS/GPS Hardware Receiver (`NOT VERIFIED ON HARDWARE`)**:
   - No NMEA-0183 serial UART receiver is attached; coordinates are generated via stationary reference coordinates with synthetic jitter.
4. **MQTT Live Broker Connectivity (`NOT VERIFIED WITH EXTERNAL BROKER`)**:
   - Live network socket connection to an external Mosquitto broker daemon has **not been verified** with live broker test evidence.
   - The application has been verified using its internal publish/subscribe logic and resilient in-memory buffer fallback.
5. **Elasticsearch Cluster Document Indexing (`NOT VERIFIED WITH LIVE CLUSTER`)**:
   - Live HTTP indexing to an active Elasticsearch cluster has **not been verified** with cluster test evidence.
   - Document creation and search queries have been verified against the resilient local in-memory fallback store.

---

## 5. Remaining Work & Next Steps

1. Review project lead responses regarding verified vendor protocols and physical hardware pinouts.
2. Flash Acconeer RSS C-SDK to target microcontroller (STM32WB55 or Nordic nRF52840).
3. Replace application-level 12-byte demo protocol with official MCU payload format once specified.
4. Integrate native Web Bluetooth or Noble daemon for hardware BLE pairing.
5. Spin up external Mosquitto and Elasticsearch instances to verify live network socket connections and cluster indexing.
