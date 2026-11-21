// frontend/src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import DemoBanner from './components/DemoBanner';
import StatCards from './components/StatCards';
import WaterLevelChart from './components/WaterLevelChart';
import DeviceBlePanel from './components/DeviceBlePanel';
import GpsPanel from './components/GpsPanel';
import MqttPanel from './components/MqttPanel';
import ElasticsearchPanel from './components/ElasticsearchPanel';
import TelemetryTable from './components/TelemetryTable';
import AcconeerModal from './components/AcconeerModal';
import { api } from './services/api';

export default function App() {
  // State
  const [health, setHealth] = useState(null);
  const [latestTelemetry, setLatestTelemetry] = useState(null);
  const [history, setHistory] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [devicesState, setDevicesState] = useState(null);
  const [location, setLocation] = useState(null);
  const [mqttState, setMqttState] = useState(null);
  const [esState, setEsState] = useState(null);
  const [acconeerConfig, setAcconeerConfig] = useState(null);

  const [simulatorStatus, setSimulatorStatus] = useState({ isRunning: true, intervalMs: 3000 });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isSpecsOpen, setIsSpecsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, ble, mqtt, storage, history

  // Fetch full telemetry & subsystems
  const refreshAll = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const [
        healthRes,
        latestRes,
        historyRes,
        devicesRes,
        locationRes,
        mqttRes,
        esRes,
        acconeerRes
      ] = await Promise.allSettled([
        api.getHealth(),
        api.getTelemetryLatest(),
        api.getTelemetryHistory(50),
        api.getDevices(),
        api.getLocation(),
        api.getMqttStatus(),
        api.getElasticsearchStatus(),
        api.getAcconeerConfig()
      ]);

      if (healthRes.status === 'fulfilled') {
        setHealth(healthRes.value);
        if (healthRes.value?.subsystems?.simulator) {
          setSimulatorStatus(healthRes.value.subsystems.simulator);
        }
      }

      if (latestRes.status === 'fulfilled' && latestRes.value?.data) {
        setLatestTelemetry(latestRes.value.data);
      }

      if (historyRes.status === 'fulfilled' && historyRes.value?.data) {
        setHistory(historyRes.value.data);
        setStatistics(historyRes.value.statistics);
      }

      if (devicesRes.status === 'fulfilled' && devicesRes.value?.data) {
        setDevicesState(devicesRes.value.data);
      }

      if (locationRes.status === 'fulfilled' && locationRes.value?.data) {
        setLocation(locationRes.value.data);
      }

      if (mqttRes.status === 'fulfilled' && mqttRes.value?.data) {
        setMqttState(mqttRes.value.data);
      }

      if (esRes.status === 'fulfilled' && esRes.value?.data) {
        setEsState(esRes.value.data);
      }

      if (acconeerRes.status === 'fulfilled') {
        setAcconeerConfig(acconeerRes.value);
      }

    } catch (err) {
      console.error('Failed to refresh data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Live auto-poll loop every 2.5s for real-time telemetry updates
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const [latestRes, historyRes, mqttRes, esRes] = await Promise.allSettled([
          api.getTelemetryLatest(),
          api.getTelemetryHistory(30),
          api.getMqttStatus(),
          api.getElasticsearchStatus()
        ]);

        if (latestRes.status === 'fulfilled' && latestRes.value?.data) {
          setLatestTelemetry(latestRes.value.data);
        }

        if (historyRes.status === 'fulfilled' && historyRes.value?.data) {
          setHistory(historyRes.value.data);
          setStatistics(historyRes.value.statistics);
        }

        if (mqttRes.status === 'fulfilled' && mqttRes.value?.data) {
          setMqttState(mqttRes.value.data);
        }

        if (esRes.status === 'fulfilled' && esRes.value?.data) {
          setEsState(esRes.value.data);
        }
      } catch (err) {
        console.warn('Polling error:', err);
      }
    }, 2500);

    return () => clearInterval(pollInterval);
  }, []);

  // Handlers
  const handleToggleSimulator = async (running) => {
    try {
      const res = await api.toggleSimulator(running);
      if (res?.simulator) {
        setSimulatorStatus(res.simulator);
      }
    } catch (err) {
      alert(`Error toggling simulator: ${err.message}`);
    }
  };

  const handleStepSimulator = async () => {
    try {
      const res = await api.stepSimulator();
      if (res?.data) {
        setLatestTelemetry(res.data);
        refreshAll();
      }
    } catch (err) {
      alert(`Error running single step: ${err.message}`);
    }
  };

  const handleScanDevices = async () => {
    try {
      setIsScanning(true);
      const res = await api.scanDevices(1500);
      if (res?.devices && devicesState) {
        setDevicesState({ ...devicesState, devices: res.devices });
      }
    } catch (err) {
      alert(`BLE Scan error: ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleConnectDevice = async (deviceId) => {
    try {
      await api.connectDevice(deviceId);
      const devicesRes = await api.getDevices();
      if (devicesRes?.data) setDevicesState(devicesRes.data);
    } catch (err) {
      alert(`Connection error: ${err.message}`);
    }
  };

  const handleDisconnectDevice = async (deviceId) => {
    try {
      await api.disconnectDevice(deviceId);
      const devicesRes = await api.getDevices();
      if (devicesRes?.data) setDevicesState(devicesRes.data);
    } catch (err) {
      alert(`Disconnection error: ${err.message}`);
    }
  };

  const handleGpsSourceChange = async (newSource) => {
    try {
      const res = await api.setLocationSource(newSource);
      if (res?.data) setLocation(res.data);
    } catch (err) {
      alert(`Failed to set GPS source: ${err.message}`);
    }
  };

  const handlePublishTestMqtt = async (payload, topic) => {
    const res = await api.publishMqtt(payload, topic);
    const updatedMqtt = await api.getMqttStatus();
    if (updatedMqtt?.data) setMqttState(updatedMqtt.data);
    return res;
  };

  const handleSearchElasticsearch = async (query, limit) => {
    return api.searchElasticsearch(query, limit);
  };

  const handleDecodeHex = async (hexString) => {
    return api.decodeBleHex(hexString);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 p-3 sm:p-6 lg:p-8 max-w-[1500px] mx-auto">
      
      {/* Top Header */}
      <Header
        simulatorStatus={simulatorStatus}
        onToggleSimulator={handleToggleSimulator}
        onStepSimulator={handleStepSimulator}
        onRefresh={refreshAll}
        isRefreshing={isRefreshing}
        onOpenSpecs={() => setIsSpecsOpen(true)}
      />

      {/* Prominent Demo Mode Indicator */}
      <DemoBanner
        simulatorStatus={simulatorStatus}
        hardwareStatus={acconeerConfig?.hardwareStatus}
      />

      {/* High-Level Overview Stat Cards */}
      <StatCards
        telemetry={latestTelemetry}
        devicesState={devicesState}
        mqttState={mqttState}
        esState={esState}
        location={location}
      />

      {/* Navigation Tabs for clean organized views */}
      <div className="flex items-center gap-1.5 mb-5 border-b border-slate-800 pb-2.5 overflow-x-auto">
        {[
          { id: 'overview', label: 'SYSTEM OVERVIEW' },
          { id: 'ble', label: 'BLE & BYTE DECODER' },
          { id: 'mqtt', label: 'MQTT INGESTION' },
          { id: 'storage', label: 'ELASTICSEARCH INDEX' },
          { id: 'history', label: 'TELEMETRY ARCHIVE' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded text-xs font-mono font-medium whitespace-nowrap transition ${
              activeTab === tab.id
                ? 'bg-[#141e33] text-sky-400 border border-sky-500/40 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview (Chart + GPS + Recent Table) */}
      {activeTab === 'overview' && (
        <>
          <WaterLevelChart
            history={history}
            statistics={statistics}
            tankHeight={latestTelemetry?.calibration?.tankHeightMeters || 5.0}
          />

          <GpsPanel
            location={location}
            onSourceChange={handleGpsSourceChange}
          />

          <TelemetryTable
            history={history}
            onRefresh={refreshAll}
            isRefreshing={isRefreshing}
          />
        </>
      )}

      {/* Tab 2: BLE & Raw Hex Decoder */}
      {activeTab === 'ble' && (
        <DeviceBlePanel
          devicesState={devicesState}
          latestTelemetry={latestTelemetry}
          onScan={handleScanDevices}
          isScanning={isScanning}
          onConnect={handleConnectDevice}
          onDisconnect={handleDisconnectDevice}
          onDecodeHex={handleDecodeHex}
        />
      )}

      {/* Tab 3: MQTT */}
      {activeTab === 'mqtt' && (
        <MqttPanel
          mqttState={mqttState}
          onPublishTest={handlePublishTestMqtt}
        />
      )}

      {/* Tab 4: Elasticsearch */}
      {activeTab === 'storage' && (
        <ElasticsearchPanel
          esState={esState}
          onSearch={handleSearchElasticsearch}
        />
      )}

      {/* Tab 5: History */}
      {activeTab === 'history' && (
        <TelemetryTable
          history={history}
          onRefresh={refreshAll}
          isRefreshing={isRefreshing}
        />
      )}

      {/* Acconeer A121 Specification Modal */}
      <AcconeerModal
        isOpen={isSpecsOpen}
        onClose={() => setIsSpecsOpen(false)}
        acconeerConfig={acconeerConfig}
      />

      {/* Footer */}
      <footer className="mt-8 pt-4 border-t border-slate-900 text-center text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>IoT Water Level Detection System • Acconeer A121 Reference Architecture</span>
        <span className="font-mono text-[11px] text-slate-500">
          Environment: {health?.environment || 'development'} • Version: 1.0.0 (MVP)
        </span>
      </footer>

    </div>
  );
}
