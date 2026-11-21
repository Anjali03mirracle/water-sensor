# IoT-Based Water Level Detection System (MVP)

A complete, production-grade IoT monitoring application for real-time water level and reservoir telemetry. The architecture references the **Acconeer A121 60 GHz Pulsed Coherent Radar (PCR)** sensor, streaming through a **Bluetooth Low Energy (BLE)** gateway, publishing over **MQTT**, indexing to **Elasticsearch**, and visualizing via a responsive **React** dashboard.

---

> **DEMO & HARDWARE EMULATION NOTICE**  
> Physical Acconeer A121 radar transceivers and native BLE gateways require dedicated hardware (SPI interface MCU, Acconeer RSS library, OS Bluetooth daemons). When running without physical hardware, this application operates in **Verified Demo Mode**, providing mathematical radar distance emulation, binary BLE byte decoding, and resilient fallback storage. **All simulated data is explicitly tagged with `isDemoData: true` and status bit `0x80`.**

---

## Architecture & Data Flow

```mermaid
flowchart TD
    subgraph SENSING["1. Edge Sensing Layer"]
        A121["Acconeer A121 (60 GHz PCR Radar)<br/>Pulsed Coherent Radar Sensor"]
        MCU["Host MCU (e.g. Nordic nRF52840 / STM32)<br/>Acconeer RSS C-SDK v1.4+"]
        A121 -->|SPI Bus 50MHz| MCU
    end

    subgraph BLE_LAYER["2. Wireless Transport"]
        GATT["BLE Peripheral / GATT Server<br/>Service: 6E400001-B5A3...<br/>Telemetry Rx Char: 6E400003..."]
        FRAME["12-Byte Binary Frame<br/>[Header][Dist mm][SNR][Batt][Temp][Flags][Seq][CRC]"]
        MCU --> GATT
        GATT --> FRAME
    end

    subgraph BACKEND["3. Node.js & Express Backend Service"]
        ADAPTER["BLE Adapter Interface<br/>(Discovery, Connect/Disconnect, Stream)"]
        DECODER["BLE Payload Decoder<br/>(Configurable Byte Mapping)"]
        ACCONEER_MATH["Acconeer Geometry Service<br/>Water Level = Mount Height - Radar Dist"]
        GPS_SVC["GPS Location Service<br/>(Geo-Referencing, Configurable Source)"]
        SIM["Realistic Fluid Dynamic Simulator<br/>(Sinusoidal tides, ripple, battery, demo flags)"]
        
        FRAME --> ADAPTER
        ADAPTER --> DECODER
        SIM -.->|Simulated 12-byte Hex| DECODER
        DECODER --> ACCONEER_MATH
        GPS_SVC --> ACCONEER_MATH
    end

    subgraph INTEGRATION["4. Messaging & Storage Layer"]
        MQTT_BROKER["MQTT Broker (Eclipse Mosquitto)<br/>Topic: growthtech/iot/water-level/device-001/telemetry"]
        ES_CLUSTER["Elasticsearch 8.x Cluster<br/>Index: iot-telemetry-water-level"]
        LOCAL_BUF["Resilient In-Memory Fallback Storage<br/>(Active if Broker or ES is offline)"]

        ACCONEER_MATH -->|Publish QoS 1| MQTT_BROKER
        ACCONEER_MATH -->|Index Document| ES_CLUSTER
        MQTT_BROKER -.->|Offline Fallback| LOCAL_BUF
        ES_CLUSTER -.->|Offline Fallback| LOCAL_BUF
    end

    subgraph DASHBOARD["5. Frontend Monitoring (React + Vite)"]
        UI_OVERVIEW["Dashboard Overview & Stat Cards<br/>(Level m/%, Distance, Status High/Low/Norm)"]
        UI_CHART["Live SVG Water-Level Area Chart<br/>(High 85% & Low 20% Threshold Bands)"]
        UI_BLE["BLE Device Manager & Raw Hex Viewer<br/>(Live Byte Map & Manual Hex Decoder)"]
        UI_GPS["GPS Spatial Card<br/>(OpenStreetMap Integration, Source Selector)"]
        UI_MQTT["MQTT Monitor & Test Publisher"]
        UI_ES["Elasticsearch Query & Telemetry Log"]

        BACKEND -->|REST APIs & Polling| DASHBOARD
    end
```

---

## Technologies Used

- **Frontend**: React 18, Vite, Tailwind CSS v4, Lucide Icons
- **Backend**: Node.js v20+, Express.js 4, native Node Test Runner
- **Protocols & Drivers**:
  - `mqtt` (MQTT.js client with auto-reconnect and offline buffering)
  - `@elastic/elasticsearch` (Official Elasticsearch 8.x JavaScript client)
  - Custom BLE Payload Decoder & GATT specification adapter
- **Infrastructure**: Docker Compose, Eclipse Mosquitto 2.0, Elasticsearch 8.15

---

## Directory Structure

```
iot-water-level-system/
├── backend/
│   ├── src/
│   │   ├── app.js                      # Express middleware and route mounting
│   │   ├── server.js                   # Server bootstrap & simulator launcher
│   │   ├── routes/
│   │   │   ├── telemetryRoutes.js      # /api/telemetry (latest, history, ingest, toggle)
│   │   │   ├── deviceRoutes.js         # /api/devices (scan, connect, disconnect)
│   │   │   ├── locationRoutes.js       # /api/location (source configuration)
│   │   │   ├── mqttRoutes.js           # /api/mqtt/status & publish
│   │   │   └── systemRoutes.js         # /api/health, ES, BLE decoder spec
│   │   ├── services/
│   │   │   ├── acconeerA121Adapter.js  # A121 radar RSS configuration & calibration math
│   │   │   ├── bleAdapter.js           # BLE discovery & connection state machine
│   │   │   ├── bleDecoder.js           # 12-byte binary payload encoder & decoder
│   │   │   ├── gpsService.js           # GPS location service with source switching
│   │   │   ├── mqttService.js          # MQTT pub/sub client with buffer fallback
│   │   │   ├── elasticsearchService.js # Elasticsearch indexing & search fallback
│   │   │   ├── sensorDataService.js    # Telemetry storage & coordinator
│   │   │   └── simulator.js            # Realistic fluid dynamics & BLE frame generator
│   │   └── utils/
│   │       └── logger.js               # Structured logger
│   ├── tests/
│   │   ├── acconeerA121.test.js        # Radar geometry calculation tests
│   │   ├── bleDecoder.test.js          # Byte encoding & decoding tests
│   │   └── api.test.js                 # Express REST endpoint tests
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx              # Navigation, simulator stream controls, clock
│   │   │   ├── DemoBanner.jsx          # Prominent Demo Mode & Hardware notification
│   │   │   ├── StatCards.jsx           # Level, Clearance, BLE, MQTT, ES cards
│   │   │   ├── WaterLevelChart.jsx     # Interactive SVG Area Chart with thresholds
│   │   │   ├── DeviceBlePanel.jsx      # BLE Scanner, GATT specs, Raw Hex Viewer
│   │   │   ├── GpsPanel.jsx            # Lat/Lon, elevation, source selector, OSM link
│   │   │   ├── MqttPanel.jsx           # MQTT topic stats, message stream, test publish
│   │   │   ├── ElasticsearchPanel.jsx  # Cluster status, index preview, search filter
│   │   │   ├── TelemetryTable.jsx      # Historical data table with CSV export
│   │   │   └── AcconeerModal.jsx       # A121 technical architecture & calibration specs
│   │   ├── services/
│   │   │   └── api.js                  # Frontend API client
│   │   ├── App.jsx                     # Dashboard state and tab management
│   │   ├── main.jsx                    # React entrypoint
│   │   └── index.css                   # Tailwind v4 styling & dark theme
│   ├── index.html
│   ├── vite.config.js                  # Proxy configuration to :5000
│   └── package.json
├── docker-compose.yml                  # Mosquitto MQTT broker & Elasticsearch
├── mosquitto.conf                      # Mosquitto broker configuration
├── .env.example                        # Root environment template
├── .gitignore
├── package.json                        # Root monorepo script runner
└── README.md
```

---

## Quickstart & Installation

### Prerequisites
- **Node.js** (v18 or v20+ recommended)
- **npm** (v9+)
- *(Optional)* **Docker Desktop** (if you wish to run local Mosquitto MQTT & Elasticsearch)

### 1. Clone & Enter Project Directory
```bash
cd iot-water-level-system
```

### 2. Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

cd ..
```

### 3. Environment Configuration
The project is pre-configured with safe zero-config defaults. To customize:
```bash
cp .env.example backend/.env
```

Key environment variables:
| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `PORT` | `5000` | Backend HTTP API port |
| `SIMULATOR_ENABLED` | `true` | Starts the A121 sensor simulator automatically |
| `SIMULATOR_INTERVAL_MS` | `3000` | Telemetry packet generation interval (milliseconds) |
| `TANK_HEIGHT_METERS` | `5.0` | Total usable tank height |
| `SENSOR_MOUNTING_HEIGHT_METERS` | `5.2` | Height of Acconeer sensor face from tank bottom |
| `TANK_CRITICAL_HIGH_PERCENT` | `85.0` | High water level threshold (%) |
| `TANK_LOW_PERCENT` | `20.0` | Low water level threshold (%) |
| `MQTT_BROKER_URL` | `mqtt://localhost:1883` | MQTT Broker URL |
| `MQTT_TOPIC` | `growthtech/iot/water-level/device-001/telemetry` | Configured telemetry topic |
| `ELASTICSEARCH_NODE` | `http://localhost:9200` | Elasticsearch node endpoint |
| `ELASTICSEARCH_INDEX` | `iot-telemetry-water-level` | Target telemetry index |
| `GPS_SOURCE` | `SIMULATED_DEMO` | Active GPS location source |

---

## Running the Application

### Option A: Standard Mode (Demo / Resilient Local Buffering)
Neither Docker nor external services are required. The backend will automatically activate offline fallback buffers for MQTT and Elasticsearch if they are not running.

1. **Start the Backend:**
   ```bash
   cd backend
   npm start
   # Server runs on http://localhost:5000
   ```

2. **Start the Frontend Dashboard:**
   In a separate terminal:
   ```bash
   cd frontend
   npm run dev
   # Dashboard available on http://localhost:3000
   ```

3. Open **http://localhost:3000** in your browser.

---

### Option B: Full Infrastructure Mode with Docker (MQTT + Elasticsearch)

If Docker is available on your system, you can spin up a real Mosquitto MQTT broker and an Elasticsearch 8.x instance:

```bash
# Start Mosquitto (port 1883) and Elasticsearch (port 9200)
docker compose up -d
```

Verify services:
- Mosquitto MQTT Broker: `localhost:1883`
- Elasticsearch Cluster: `http://localhost:9200`

Then run `npm start` in `backend` and `npm run dev` in `frontend`. The backend will automatically connect to both services.

To shut down containers:
```bash
docker compose down
```

> **INFRASTRUCTURE VERIFICATION NOTE**: In this MVP evaluation, actual network socket connectivity to a live external/Docker MQTT broker and document indexing to a live Elasticsearch cluster have **NOT been verified with live external daemon test evidence**. The application has been verified using its resilient in-memory fallback buffers and mock client status reporting.

---

## BLE Binary Byte Frame & Decoder [DEMO / PLACEHOLDER]

> **TECHNICAL ACCURACY NOTE**: The Acconeer A121 is an SPI-interfaced radar sensor with no native Bluetooth radio. The 12-byte binary frame format and BLE GATT UUIDs below are **application-level DEMO / PLACEHOLDER definitions**, not an official Acconeer AB vendor specification.

The simulated BLE gateway streams telemetry as a compact **12-byte binary payload**:

| Byte Offset | Field | Type | Description / Interpretation |
| :---: | :--- | :---: | :--- |
| `0` | **Header Magic** | `Uint8` | Fixed identifier byte `0xAA` |
| `1` | **Protocol Version** | `Uint8` | Payload schema version (`0x01`) |
| `2 - 3` | **Distance to Surface** | `Uint16 BE` | Radar distance in millimeters (e.g. `0x0B B8` = 3000 mm = 3.000 m) |
| `4` | **Signal Quality (SNR)** | `Uint8` | Radar reflection confidence score (`0 - 100%`) |
| `5` | **Battery Level** | `Uint8` | Internal battery state of charge (`0 - 100%`) |
| `6` | **Sensor Temperature** | `Int8` | Die temperature in degrees Celsius (signed) |
| `7` | **Status Flags Bitfield** | `Uint8` | • Bit 0: Radar Target Locked<br/>• Bit 1: Surface Ripple/Wave Alert<br/>• Bit 2: Hardware Fault<br/>• Bit 7: **Simulated Demo Indicator** (`1 = Demo, 0 = Real HW`) |
| `8 - 9` | **Sequence Counter** | `Uint16 BE` | Rolling message sequence number (`0 - 65535`) |
| `10 - 11` | **16-Bit Checksum** | `Uint16 BE` | Sum of bytes 0 through 9 modulo 65536 |

### Interactive Hex Decoder in Frontend
Navigate to the **BLE & Payload Decoder** tab in the dashboard to view real-time raw hex streams (e.g. `AA 01 0B B8 5A 60 16 81 00 12 3E 44`), inspect each byte's meaning, or paste any custom 12-byte hex string to decode it immediately.

---

## Acconeer A121 Radar Sensor Integration

### Tank Geometry Calculation
The Acconeer A121 is mounted at the top of the tank pointing downward toward the fluid surface:
$$\text{Water Level} = \text{Sensor Mounting Height} (5.2\,\text{m}) - \text{Measured Radar Distance} (d)$$
$$\text{Water Level Percentage} = \left(\frac{\text{Water Level}}{\text{Tank Usable Height} (5.0\,\text{m})}\right) \times 100$$

- **Deadzone / Blind Spot**: The sensor has a minimum blind zone of **50 mm** ($0.05\,\text{m}$) directly in front of the lens.
- **Critical High Alert**: $\ge 85\%$ ($4.25\,\text{m}$)
- **Low Water Alert**: $\le 20\%$ ($1.00\,\text{m}$)

### Hardware Availability & Physical Integration Requirements
> **TECHNICAL ACCURACY NOTE**: The configuration parameters below (Profile 3, PRF 15.6 MHz, 32 HWAAS) are **illustrative DEMO assumptions** based on typical radar concepts, NOT certified factory calibration settings. Physical hardware is **NOT CONNECTED** in this MVP.

The software adapter models an illustrative RSS configuration structure:
- **Radar Profile**: Profile 3 (Balanced range and SNR for fluid tanks up to 7 meters)
- **Pulse Repetition Frequency (PRF)**: 15.6 MHz
- **HWAAS (Hardware Accelerated Averaging Samples)**: 32 sweeps per frame
- **Receiver Gain**: 15 dB
- **Idle State**: `DEEP_SLEEP`

**What Requires Physical Hardware:**
1. **Acconeer XE121 Evaluation Kit** or custom PCB with A121 PCR transceiver chip.
2. **Host MCU with high-speed SPI bus** (e.g. Nordic nRF52840 or STM32WB55) flashed with the official Acconeer RSS C-SDK.
3. **BLE Peripheral Firmware** implementing the GATT Service UUID (`6E400001-...`) and Telemetry Characteristic (`6E400003-...`).
4. **Protective Radome / Lens Window**: PTFE or polyethylene hydrophobic housing to shield the radar horn from corrosive vapors and condensation.

---

## REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Comprehensive system health check, uptime, and subsystem statuses |
| `GET` | `/api/telemetry/latest` | Most recent telemetry reading with Acconeer calculations & raw hex |
| `GET` | `/api/telemetry` | Historical readings (`?limit=50&offset=0`) and statistical summary |
| `POST` | `/api/telemetry` | Ingest new measurement (accepts `distanceMeters` or `rawHex`) |
| `POST` | `/api/telemetry/simulator/toggle` | Start or pause the simulated sensor stream |
| `POST` | `/api/telemetry/simulator/step` | Trigger a single simulated radar pulse |
| `GET` | `/api/devices` | BLE device inventory, current connection state, GATT UUIDs |
| `POST` | `/api/devices/scan` | Trigger simulated BLE peripheral discovery scan |
| `POST` | `/api/devices/:id/connect` | Connect to specified BLE device |
| `POST` | `/api/devices/:id/disconnect`| Disconnect from specified BLE device |
| `GET` | `/api/location` | Current GPS coordinates, elevation, accuracy, and source |
| `POST` | `/api/location/source` | Switch location source (`SIMULATED_DEMO`, `NMEA_SERIAL_UART`, etc.) |
| `GET` | `/api/mqtt/status` | MQTT connection status, topic, publish count, message stream buffer |
| `POST` | `/api/mqtt/publish` | Publish custom message over MQTT |
| `GET` | `/api/elasticsearch/status` | Elasticsearch cluster status, target index, indexed count |
| `GET` | `/api/elasticsearch/records` | Query/filter indexed telemetry documents (`?query=...&limit=20`) |
| `GET` | `/api/acconeer/config` | Acconeer A121 RSS profile parameters and calibration values |
| `GET` | `/api/ble/decoder-spec` | Byte mapping layout and field descriptions |
| `POST` | `/api/ble/decode-hex` | Decode arbitrary 12-byte hex string in real-time |

---

## Testing & Verification

The backend includes automated unit and integration tests using Node's native test runner:

```bash
cd backend
npm test
```

### Verified Test Cases (12 / 12 Passing):
1. `AcconeerA121Adapter - calculate water level geometry`: Validates mounting height offset ($5.2\text{m} - d$), fluid capacity clamping, percentage calculation, and `HIGH`/`LOW`/`NORMAL` threshold classification.
2. `BlePayloadDecoder - encode and decode roundtrip`: Encodes 12-byte binary buffer and verifies distance, SNR, battery, temperature, sequence, flags, and checksum.
3. `BlePayloadDecoder - decode from formatted hex string`: Verifies decoding from hex strings with spaces or delimiters.
4. `BlePayloadDecoder - rejects malformed payloads and short buffers`: Asserts underflow and odd-nibble hex string errors.
5. `BlePayloadDecoder - flags invalid checksum with validation warnings`: Tests corrupted checksum byte detection.
6. `BlePayloadDecoder - returns complete byte mapping documentation`: Verifies field table (offsets, types, byte orders, scales, units).
7. `API - GET /api/health`: Verifies health status, demo flag, and subsystem metadata.
8. `API - GET /api/devices`: Verifies BLE inventory retrieval with demo tags and explicit `isHardwareConnected: false`.
9. `API - POST /api/telemetry`: Verifies custom reading ingestion and handbook structure (`device_id`, `measurement`, `location`, `source`).
10. `API - GET /api/location`: Verifies GPS coordinates, precision reporting, and `UNAVAILABLE`/`PERMISSION_DENIED` states.
11. `API - GET /api/mqtt/status`: Verifies broker status and topic information.
12. `API - POST /api/ble/decode-hex`: Verifies real-time 12-byte hex decoding into distance and water level.

---

## Project Documentation

Detailed project phase tracking and governance documents are available in the `/docs` directory:
- [Initial Phase Report](docs/INITIAL_PHASE_REPORT.md): Training activities breakdown, time spent, test evidence, and blockers.
- [Team Lead Questions](docs/TEAM_LEAD_QUESTIONS.md): Technical questionnaire on exact BLE UUIDs, payload protocol, Acconeer hardware pinouts, and infrastructure.

---

## Git Governance & Submission

> **COMPANY GOVERNANCE NOTICE**: In accordance with the training handbook, the company-approved repository URL and access permissions are issued following lead review. Company code must **NOT** be pushed to personal GitHub repositories (`https://github.com/Anjali03mirracle/water-sensor.git`) unless authorized in writing.

### Local Commit Instructions
```bash
# 1. Stage all verified project files
git add .

# 2. Create clean initial MVP commit
git commit -m "feat: initial IoT water level monitoring MVP"

# 3. When personal or company remote push is authorized:
# git remote add origin <authorized-repository-url>
# git branch -M main
# git push -u origin main
```
