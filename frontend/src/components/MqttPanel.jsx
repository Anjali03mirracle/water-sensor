// frontend/src/components/MqttPanel.jsx
import React, { useState } from 'react';
import { Radio, Send, CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';

export default function MqttPanel({ mqttState, onPublishTest }) {
  const [testPayload, setTestPayload] = useState('{"command":"REQUEST_CALIBRATION_BURST","burstCount":5}');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  const isConnected = mqttState?.isConnected;
  const brokerUrl = mqttState?.brokerUrl || 'mqtt://localhost:1883';
  const topic = mqttState?.topic || 'growthtech/iot/water-level/device-001/telemetry';
  const publishedCount = mqttState?.messagesPublishedCount ?? 0;
  const receivedCount = mqttState?.messagesReceivedCount ?? 0;
  const recentMessages = mqttState?.recentMessages || [];

  const handlePublish = async () => {
    try {
      setIsSending(true);
      setSendResult(null);
      let payloadToSend;
      try {
        payloadToSend = JSON.parse(testPayload);
      } catch {
        payloadToSend = testPayload;
      }
      const res = await onPublishTest(payloadToSend, topic);
      setSendResult({ success: true, message: 'Message submitted to MQTT service' });
    } catch (err) {
      setSendResult({ success: false, message: err.message });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="glass-card p-5 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              MQTT Broker Ingestion & Subscriptions
              <span className={`badge ${isConnected ? 'badge-normal' : 'badge-low'}`}>
                {isConnected ? 'BROKER CONNECTED' : 'OFFLINE BUFFER ACTIVE'}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Bi-directional pub/sub event pipeline using MQTT.js
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Broker:</span>
          <span className="text-cyan-300 bg-slate-900 px-2 py-1 rounded border border-slate-800">
            {brokerUrl}
          </span>
        </div>
      </div>

      {/* Top Details Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-xs font-mono">
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-slate-400 block text-[10px] uppercase font-sans">Active Topic</span>
          <span className="text-cyan-400 font-bold break-all">{topic}</span>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-slate-400 block text-[10px] uppercase font-sans">Published Packets</span>
          <span className="text-white font-bold text-sm">{publishedCount} messages</span>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-slate-400 block text-[10px] uppercase font-sans">Subscribed Inbound</span>
          <span className="text-emerald-400 font-bold text-sm">{receivedCount} messages (QoS 1)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* LEFT 2 COLS: Live MQTT Message Stream */}
        <div className="lg:col-span-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Recent MQTT Messages Stream</span>
            <span className="text-[11px] text-slate-500 font-mono">Ring Buffer (Last 15)</span>
          </div>

          <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
            {recentMessages.length === 0 ? (
              <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-500 font-mono">
                No messages published yet. Start the simulator or publish a test packet.
              </div>
            ) : (
              recentMessages.map((msg, idx) => {
                const isOut = msg.direction === 'OUTBOUND';
                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 font-mono text-xs flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        {isOut ? (
                          <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
                        ) : (
                          <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        <span className={isOut ? 'text-cyan-400 font-bold' : 'text-emerald-400 font-bold'}>
                          {msg.direction}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400">{msg.topic}</span>
                      </div>
                      <span className="text-slate-500 text-[10px]">
                        {new Date(msg.publishedAt || msg.receivedAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <pre className="text-[11px] text-slate-300 bg-slate-900/60 p-1.5 rounded overflow-x-auto">
                      {typeof msg.payload === 'object' ? JSON.stringify(msg.payload, null, 2) : msg.payload}
                    </pre>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COL: Test MQTT Publisher Box */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-cyan-400" />
              Publish Test Payload
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Inject JSON payload to verified broker topic. If broker is offline, message is safely recorded into local telemetry buffer.
            </p>
            <textarea
              rows={4}
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 mb-2"
            />
          </div>

          <div>
            <button
              onClick={handlePublish}
              disabled={isSending}
              className="btn-primary w-full justify-center text-xs"
            >
              <Send className="w-3.5 h-3.5" />
              {isSending ? 'Transmitting...' : 'Publish to Topic'}
            </button>

            {sendResult && (
              <p className={`text-[11px] mt-2 font-mono ${sendResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                {sendResult.message}
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
