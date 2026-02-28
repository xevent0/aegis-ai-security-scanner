
import React, { useState, useEffect } from 'react';
import { TargetType, ScanResult, ScanSettings } from '../types';
import { Code, Globe, Network, ShieldCheck, ArrowRight, Loader2, AlertCircle, Terminal } from 'lucide-react';
import { performScan } from '../services/geminiScanner';

interface ScanInterfaceProps {
  onScanComplete: (result: ScanResult) => void;
  settings: ScanSettings;
}

const ScanInterface: React.FC<ScanInterfaceProps> = ({ onScanComplete, settings }) => {
  const [targetType, setTargetType] = useState<TargetType>(TargetType.CODE);
  const [input, setInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanLog, setScanLog] = useState<{ msg: string; time: string }[]>([]);

  const handleStartScan = async () => {
    if (!input.trim()) {
      setError("Please provide target input before scanning.");
      return;
    }
    
    if (input.length > 50000) {
      setError("Input is too large (max 50,000 characters).");
      return;
    }

    setError(null);
    setIsScanning(true);
    const now = () => new Date().toLocaleTimeString([], { hour12: false });
    setScanLog([
      { msg: "Initializing Aegis Intelligence Engine...", time: now() },
      { msg: "Calibrating severity weights...", time: now() },
    ]);

    const logs = {
      [TargetType.CODE]: ["Loading SAST modules...", "Parsing abstract syntax tree...", "Scanning for injection patterns...", "Verifying cryptographic strength..."],
      [TargetType.WEB_APP]: ["Starting OSINT reconnaissance...", "Fetching public header data via Google Search...", "Analyzing TLS configuration...", "Fingerprinting web server...", "Checking for common path exposures..."],
      [TargetType.NETWORK]: ["Targeting network nodes...", "Simulating port discovery...", "Searching for known CVEs via Grounding...", "Evaluating firewall/CORS policies..."]
    };

    const interval = setInterval(() => {
      setScanLog(prev => {
        const nextLog = logs[targetType][prev.length - 2];
        if (nextLog) return [...prev, { msg: nextLog, time: now() }];
        return prev;
      });
    }, 1500);

    try {
      const result = await performScan(input, targetType, settings);
      clearInterval(interval);
      const doneTime = new Date().toLocaleTimeString([], { hour12: false });
      setScanLog(prev => [
        ...prev,
        { msg: "Finalizing report structure...", time: doneTime },
        { msg: "Analysis Complete!", time: doneTime },
      ]);
      setTimeout(() => onScanComplete(result), 1000);
    } catch (err: any) {
      clearInterval(interval);
      setError(err.message || "An unexpected error occurred during the scan.");
      setIsScanning(false);
    }
  };

  const types = [
    { id: TargetType.CODE, icon: Code, label: 'Source Code', desc: 'SAST: Deep code flow analysis' },
    { id: TargetType.WEB_APP, icon: Globe, label: 'Web Application', desc: 'DAST: OSINT & Header Assessment' },
    { id: TargetType.NETWORK, icon: Network, label: 'Network Node', desc: 'Infra: Port & Service Audit' },
  ];

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Initialize Security Audit</h2>
          <p className="text-slate-400">Select target type and provide parameters for Aegis AI analysis.</p>
        </div>
        {isScanning && (
          <div className="flex items-center gap-2 text-blue-400 text-xs font-mono animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            LIVE_ANALYSIS_ACTIVE
          </div>
        )}
      </div>

      {!isScanning ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {types.map((type) => (
              <button
                key={type.id}
                onClick={() => setTargetType(type.id)}
                className={`p-6 rounded-2xl border-2 text-left transition-all duration-300 ${
                  targetType === type.id
                    ? 'bg-blue-600/10 border-blue-600 ring-4 ring-blue-600/10'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className={`p-3 rounded-xl w-fit mb-4 ${
                  targetType === type.id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  <type.icon className="w-6 h-6" />
                </div>
                <h3 className={`font-bold mb-1 ${targetType === type.id ? 'text-white' : 'text-slate-300'}`}>
                  {type.label}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">{type.desc}</p>
              </button>
            ))}
          </div>

          <div className="space-y-6">
            <div className="relative group">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-slate-400 ml-1">
                  {targetType === TargetType.CODE ? 'Source Code Input' : 'Target URL / Domain'}
                </label>
                <span className={`text-[10px] font-mono ${input.length > 40000 ? 'text-orange-500' : 'text-slate-600'}`}>
                  {input.length.toLocaleString()} / 50,000 chars
                </span>
              </div>
              {targetType === TargetType.CODE ? (
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Paste source code or configuration files here..."
                  className="w-full h-80 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-200 code-font focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none resize-none placeholder:text-slate-700"
                />
              ) : (
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={targetType === TargetType.WEB_APP ? "https://example.com" : "192.168.1.1 or api.example.com"}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none placeholder:text-slate-700"
                />
              )}
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-900/20 border border-red-900/50 rounded-xl text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${settings.deepThinking ? 'bg-green-500' : 'bg-slate-700'}`} />
                  Deep Scan {settings.deepThinking ? 'ON' : 'OFF'}
                </div>
                {targetType !== TargetType.CODE && (
                  <div className="flex items-center gap-1 text-blue-400">
                    <Globe className="w-3 h-3" /> Grounding Enabled
                  </div>
                )}
              </div>
              <button
                onClick={handleStartScan}
                className="group relative flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-bold px-10 py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-95"
              >
                <ShieldCheck className="w-5 h-5" />
                Execute Aegis Scan
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-mono text-slate-400">AEGIS_RECON_CONSOLE_V2.0</span>
          </div>
          <div className="p-8 h-96 overflow-y-auto space-y-2 font-mono text-sm">
            {scanLog.map((log, i) => (
              <div key={i} className={`flex items-start gap-3 ${i === scanLog.length - 1 ? 'text-blue-400' : 'text-slate-500'}`}>
                <span className="text-slate-700 flex-shrink-0">[{log.time}]</span>
                <span className={i === scanLog.length - 1 ? 'animate-pulse' : ''}>
                  {i === scanLog.length - 1 && '> '} {log.msg}
                </span>
              </div>
            ))}
            <div className="animate-pulse text-blue-500 pt-4">|</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanInterface;
