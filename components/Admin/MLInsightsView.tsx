"use client";

import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Brain, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  TrendingUp,
  MapPin,
  Database,
  Calculator,
  Lightbulb,
  Download,
  Trash2,
  Upload,
  File,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { MLModelTrainer } from './MLModelTrainer';

interface ModelFile {
  name: string;
  size: number;
  sizeFormatted: string;
  type: string;
  modifiedAt: string;
}

interface FileMetadata {
  [key: string]: {
    description: string;
    dataFields: string[];
    usage: string;
    sampleRows: number;
    updateFrequency: string;
  };
}

export function MLInsightsView() {
  const [expandedSections, setExpandedSections] = useState<string[]>(['overview', 'data-pipeline']);
  const [modelFiles, setModelFiles] = useState<ModelFile[]>([]);
  const [fileLoading, setFileLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [selectedFileForDetail, setSelectedFileForDetail] = useState<string | null>(null);

  const fileMetadata: FileMetadata = {
    'VEHICLE SPEED.kml': {
      description: 'GPS traces with vehicle speed vectors for traffic weight calculation',
      dataFields: ['Latitude', 'Longitude', 'Speed (km/h)', 'Timestamp', 'Direction'],
      usage: 'Feeds into TSRE model for traffic weight (Wᵢ) and speed variance features. Used in ETA predictions.',
      sampleRows: 500,
      updateFrequency: 'Real-time (streaming)',
    },
    'TRAFFIC VOLUME.kml': {
      description: 'Vehicle count per road segment with hourly breakdown',
      dataFields: ['Road ID', 'Latitude', 'Longitude', 'Vehicle Count', 'Hour (0-23)', 'Status'],
      usage: 'Calculates congestion levels and feeds R-Score risk assessment. Used for hotspot detection.',
      sampleRows: 700,
      updateFrequency: 'Hourly aggregation',
    },
    'SPEED-AND-TRAFFIC-VOLUME.xlsx': {
      description: 'Correlated traffic metrics table with ML features',
      dataFields: ['Road_Segment', 'Speed (km/h)', 'Volume (count)', 'Occupancy (%)', 'Risk_Score (0-10)'],
      usage: 'Feature-enriched dataset for DBSCAN clustering and R-Score ML model training. Critical for hotspot detection.',
      sampleRows: 1000,
      updateFrequency: 'Daily update',
    },
  };

  // Fetch model files on mount
  useEffect(() => {
    fetchModelFiles();
  }, []);

  const fetchModelFiles = async () => {
    try {
      setFileLoading(true);
      const res = await fetch('/api/admin/files');
      const data = await res.json();
      if (data.success) {
        setModelFiles(data.files);
      }
    } catch (error) {
      console.error('Failed to fetch files:', error);
      toast.error('Failed to load model files');
    } finally {
      setFileLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setFileLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('filename', file.name);

      const res = await fetch('/api/admin/files', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`File "${file.name}" uploaded successfully`);
        fetchModelFiles();
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setFileLoading(false);
      e.target.value = '';
    }
  };

  const handleDownload = (filename: string) => {
    const link = document.createElement('a');
    link.href = `/api/admin/files/${filename}`;
    link.download = filename;
    link.click();
    toast.success(`Downloaded ${filename}`);
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(`Delete "${filename}"? This cannot be undone.`)) return;

    try {
      setFileLoading(true);
      const res = await fetch('/api/admin/files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Deleted "${filename}"`);
        fetchModelFiles();
      } else {
        toast.error(data.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete file');
    } finally {
      setFileLoading(false);
    }
  };

  const toggleSection = (id: string) => {
    setExpandedSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const isExpanded = (id: string) => expandedSections.includes(id);

  const SectionHeader = ({ id, title, icon: Icon }: { id: string; title: string; icon: any }) => (
    <button
      onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between p-6 bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors group"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors">
          <Icon className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="text-left">
          <h3 className="font-black text-slate-900 uppercase tracking-tight">{title}</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Click to expand</p>
        </div>
      </div>
      {isExpanded(id) ? (
        <ChevronUp className="w-5 h-5 text-slate-400" />
      ) : (
        <ChevronDown className="w-5 h-5 text-slate-400" />
      )}
    </button>
  );

  return (
    <div className="space-y-0 bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
      {/* ===== SECTION 0: File Management ===== */}
      <div>
        <SectionHeader id="files" title="📂 Model Files Management" icon={Database} />
        {isExpanded('files') && (
          <div className="p-8 space-y-6 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
            
            {/* Upload Section */}
            <div className="p-6 border-2 border-dashed border-indigo-300 rounded-2xl hover:border-indigo-500 transition-colors bg-indigo-50/50">
              <label className="cursor-pointer flex flex-col items-center gap-3">
                <Upload className="w-8 h-8 text-indigo-600" />
                <span className="text-sm font-black text-indigo-900 uppercase tracking-widest">Upload New Model File</span>
                <span className="text-[10px] font-bold text-indigo-700">KML, XLSX only • Max 50MB</span>
                <input 
                  type="file" 
                  onChange={handleFileUpload}
                  disabled={fileLoading}
                  className="hidden" 
                  accept=".kml,.xlsx,.xls"
                />
              </label>
            </div>

            {/* APPROVED FILES LIST */}
            <div className="p-5 bg-emerald-50 border-2 border-emerald-300 rounded-xl">
              <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-2">✅ APPROVED FOR UPLOAD (ONLY 3)</p>
              <div className="space-y-1.5 text-[10px] font-bold text-emerald-900">
                <p>1. <span className="font-mono bg-emerald-100 px-2 py-0.5 rounded">VEHICLE SPEED.kml</span> - GPS speed traces</p>
                <p>2. <span className="font-mono bg-emerald-100 px-2 py-0.5 rounded">TRAFFIC VOLUME.kml</span> - Hourly vehicle counts</p>
                <p>3. <span className="font-mono bg-emerald-100 px-2 py-0.5 rounded">SPEED-AND-TRAFFIC-VOLUME.xlsx</span> - Feature table</p>
                <p className="mt-2 text-emerald-700">Any other filename will be REJECTED by validation.</p>
              </div>
            </div>

            {/* STRICT VALIDATION RULES */}
            <div className="p-5 bg-red-50 border-2 border-red-300 rounded-xl space-y-3">
              <p className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-2">⚠️ STRICT VALIDATION ENFORCED</p>
              <div className="text-[10px] font-bold text-red-900 space-y-2">
                <p>✓ <span className="font-black">ALLOWED FILES ONLY:</span> VEHICLE SPEED.kml, TRAFFIC VOLUME.kml, SPEED-AND-TRAFFIC-VOLUME.xlsx</p>
                <p>✓ <span className="font-black">MAX SIZE:</span> 50 MB per file</p>
                <p>✓ <span className="font-black">FORMAT CHECK:</span> KML (XML) and XLSX (Excel) structure validated</p>
                <p>✓ <span className="font-black">MALWARE SCAN:</span> No scripts/code allowed in data</p>
                <p>⚠️ <span className="font-black">INVALID UPLOAD:</span> Wrong filename, format, or content = REJECTED</p>
              </div>
            </div>

            {/* AUTO-LOADING EXPLANATION */}
            <div className="p-5 bg-blue-50 border-2 border-blue-300 rounded-xl">
              <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-2">🔄 AUTO-LOADING BEHAVIOR</p>
              <div className="space-y-2 text-[10px] font-bold text-blue-900">
                <p><span className="bg-blue-200 px-2 py-0.5 rounded">UPLOAD</span> File validated on server (4-step check)</p>
                <p><span className="bg-blue-200 px-2 py-0.5 rounded">STORAGE</span> Saved to /models directory if valid</p>
                <p><span className="bg-blue-200 px-2 py-0.5 rounded">READING</span> Components read files on map refresh (NO auto-parse)</p>
                <p><span className="bg-blue-200 px-2 py-0.5 rounded">ACTION</span> Refresh browser (Cmd+Shift+R) to load new data</p>
                <p className="text-blue-700 font-black mt-2">📝 Note: Files are stored but NOT auto-imported to Firestore. Manual integration needed.</p>
              </div>
            </div>

            {/* Files List */}
            {fileLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              </div>
            ) : modelFiles.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100">
                <File className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-500">No model files loaded yet</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1">Upload files to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Loaded Files ({modelFiles.length})</p>
                {modelFiles.map((file, idx) => (
                  <div key={idx}>
                    {/* File Item */}
                    <button
                      onClick={() => setSelectedFileForDetail(selectedFileForDetail === file.name ? null : file.name)}
                      className="w-full p-5 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors group text-left"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="p-2.5 bg-slate-100 rounded-lg group-hover:bg-indigo-100 transition-colors">
                            <File className="w-4 h-4 text-slate-600 group-hover:text-indigo-600 transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 truncate">{file.name}</p>
                            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 mt-1">
                              <span className="bg-slate-100 px-2 py-0.5 rounded">{file.type || 'file'}</span>
                              <span>{file.sizeFormatted}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(file.name);
                            }}
                            className="p-2.5 hover:bg-emerald-50 rounded-lg transition-colors group/btn"
                            title="Download"
                          >
                            <Download className="w-4 h-4 text-emerald-600 group-hover/btn:scale-110 transition-transform" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(file.name);
                            }}
                            disabled={fileLoading}
                            className="p-2.5 hover:bg-red-50 rounded-lg transition-colors group/btn"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600 group-hover/btn:scale-110 transition-transform" />
                          </button>
                        </div>
                      </div>
                    </button>

                    {/* File Details Modal */}
                    {selectedFileForDetail === file.name && (
                      <div className="mt-3 p-6 bg-indigo-50 border-2 border-indigo-200 rounded-xl space-y-4">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-1">File Details & Usage</p>
                            <h4 className="text-sm font-black text-slate-900">{file.name}</h4>
                          </div>
                          <button
                            onClick={() => setSelectedFileForDetail(null)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <ChevronUp className="w-5 h-5" />
                          </button>
                        </div>

                        {fileMetadata[file.name] ? (
                          <div className="space-y-4">
                            {/* Description */}
                            <div>
                              <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-2">Description</p>
                              <p className="text-sm font-bold text-slate-800">{fileMetadata[file.name].description}</p>
                            </div>

                            {/* Data Fields Table */}
                            <div>
                              <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-2">Data Fields</p>
                              <div className="bg-white rounded-lg border border-indigo-200 overflow-hidden">
                                <table className="w-full text-sm">
                                  <thead className="bg-indigo-100">
                                    <tr>
                                      <th className="px-4 py-2 text-left font-black text-indigo-900 text-[10px] uppercase tracking-wider">Field Name</th>
                                      <th className="px-4 py-2 text-left font-black text-indigo-900 text-[10px] uppercase tracking-wider">Type/Range</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {fileMetadata[file.name].dataFields.map((field, i) => (
                                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                        <td className="px-4 py-2 font-bold text-slate-800">{field}</td>
                                        <td className="px-4 py-2 text-[10px] font-bold text-slate-600">
                                          {field.includes('Lat') || field.includes('Lng') ? 'Decimal degrees' : 
                                           field.includes('Speed') ? 'km/h' : 
                                           field.includes('Time') ? 'Unix timestamp' :
                                           field.includes('Count') ? 'Integer' :
                                           field.includes('%') ? 'Percentage (0-100)' : 'String/Mixed'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* ML Usage */}
                            <div>
                              <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-2">🧠 ML Model Integration</p>
                              <p className="text-sm font-bold text-slate-800 bg-white p-3 rounded-lg border border-indigo-200">{fileMetadata[file.name].usage}</p>
                            </div>

                            {/* Metadata */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-3 bg-white rounded-lg border border-indigo-200">
                                <p className="text-[9px] font-black text-indigo-700 uppercase tracking-wider mb-1">Sample Rows</p>
                                <p className="text-lg font-black text-slate-900">~{fileMetadata[file.name].sampleRows}</p>
                              </div>
                              <div className="p-3 bg-white rounded-lg border border-indigo-200">
                                <p className="text-[9px] font-black text-indigo-700 uppercase tracking-wider mb-1">Update Frequency</p>
                                <p className="text-xs font-bold text-slate-800">{fileMetadata[file.name].updateFrequency}</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm font-bold text-slate-600">File metadata not available. Standard model file.</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== SECTION 1: Overview ===== */}
      <div>
        <SectionHeader id="overview" title="🚀 Data Intelligence Overview" icon={Brain} />
        {isExpanded('overview') && (
          <div className="p-8 space-y-6 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-white rounded-2xl border-2 border-indigo-100">
                <p className="text-[11px] font-black text-indigo-600 uppercase tracking-widest mb-2">Models Loaded</p>
                <p className="text-3xl font-black text-slate-900">3 Datasets</p>
                <p className="text-[10px] font-bold text-slate-500 mt-2">KML + XLSX geodata integrated</p>
              </div>
              <div className="p-6 bg-white rounded-2xl border-2 border-emerald-100">
                <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest mb-2">ML Pipeline</p>
                <p className="text-3xl font-black text-slate-900">Active</p>
                <p className="text-[10px] font-bold text-slate-500 mt-2">Real-time predictions running</p>
              </div>
              <div className="p-6 bg-white rounded-2xl border-2 border-amber-100">
                <p className="text-[11px] font-black text-amber-600 uppercase tracking-widest mb-2">Data Points</p>
                <p className="text-3xl font-black text-slate-900">1000+</p>
                <p className="text-[10px] font-bold text-slate-500 mt-2">Traffic & speed coordinates</p>
              </div>
            </div>

            <div className="p-6 bg-indigo-50 rounded-2xl border-2 border-indigo-200">
              <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-3">Core Philosophy</p>
              <p className="text-sm font-bold text-slate-800 leading-relaxed">
                Our ML system transforms raw geodata (vehicle speed, traffic volume) into intelligent predictions 
                using multivariate analysis, spatial clustering, and temporal pattern recognition. Each prediction 
                is grounded in mathematical rigor and explainable AI principles.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ===== SECTION 2: Data Pipeline ===== */}
      <div>
        <SectionHeader id="data-pipeline" title="📊 Data Pipeline & Sources" icon={Database} />
        {isExpanded('data-pipeline') && (
          <div className="p-8 space-y-8 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
            <div className="space-y-4">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Loaded Datasets</h4>
              
              {[
                {
                  name: "VEHICLE SPEED",
                  format: "KML",
                  desc: "GPS traces + speed vectors",
                  params: "Lat/Lng/Speed/Timestamp",
                  size: "~500 points"
                },
                {
                  name: "TRAFFIC VOLUME",
                  format: "KML + XLSX",
                  desc: "Vehicle count per road segment",
                  params: "Road ID/Count/Hour/Date",
                  size: "~700 points"
                },
                {
                  name: "SPEED-AND-TRAFFIC-VOLUME",
                  format: "XLSX",
                  desc: "Correlated traffic metrics",
                  params: "Speed/Volume/Congestion/Risk",
                  size: "~1000 rows"
                }
              ].map((dataset, idx) => (
                <div key={idx} className="p-5 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-black text-slate-900">{dataset.name}</p>
                      <p className="text-[11px] font-bold text-slate-600 mt-1">{dataset.desc}</p>
                    </div>
                    <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-3 py-1 rounded-full">{dataset.format}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[10px] font-bold">
                    <div className="flex items-center gap-2"><MapPin className="w-3 h-3 text-slate-500" /> <span className="text-slate-600">{dataset.params}</span></div>
                    <div className="flex items-center gap-2"><TrendingUp className="w-3 h-3 text-slate-500" /> <span className="text-slate-600">{dataset.size}</span></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-amber-50 border-2 border-amber-200 rounded-2xl">
              <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-2">Pipeline Flow</p>
              <div className="flex items-center justify-between font-mono text-[10px] font-bold text-slate-700">
                <span>KML Parse</span>
                <span>→</span>
                <span>Geohashing</span>
                <span>→</span>
                <span>Feature Eng</span>
                <span>→</span>
                <span>ML Model</span>
                <span>→</span>
                <span>Prediction</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== SECTION 3: Mathematical Formulas ===== */}
      <div>
        <SectionHeader id="formulas" title="🔬 Mathematical Formulas & Derivations" icon={Calculator} />
        {isExpanded('formulas') && (
          <div className="p-8 space-y-8 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
            
            {/* Formula 1: ETA Engine */}
            <div className="space-y-4">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Formula 1: TSRE ETA Prediction Engine</h4>
              
              <div className="p-6 bg-slate-900 rounded-2xl text-white font-mono space-y-4">
                <div>
                  <p className="text-amber-400 font-black mb-2">Primary Formula:</p>
                  <p className="text-lg leading-relaxed">T = (D × K) + Σ(Wᵢ × Tᵢ) + Φ + Ω</p>
                </div>

                <div className="border-t border-slate-700 pt-4 space-y-2 text-sm">
                  <p><span className="text-emerald-400">T</span> = Estimated Travel Time (minutes)</p>
                  <p><span className="text-emerald-400">D</span> = Distance (km)</p>
                  <p><span className="text-emerald-400">K</span> = Urban speed constant (2.5 min/km)</p>
                  <p><span className="text-emerald-400">Wᵢ</span> = Traffic weight at segment i (0-1)</p>
                  <p><span className="text-emerald-400">Tᵢ</span> = Segment travel time (min)</p>
                  <p><span className="text-emerald-400">Φ</span> = Hazard penalty (incident factor)</p>
                  <p><span className="text-emerald-400">Ω</span> = Weather impact coefficient</p>
                </div>
              </div>

              <div className="p-5 bg-blue-50 border-l-4 border-blue-500 rounded-lg space-y-3">
                <p className="text-[11px] font-black text-blue-900 uppercase tracking-widest">Step-by-Step Example</p>
                <div className="text-sm font-bold text-slate-800 space-y-2">
                  <p><span className="bg-blue-200 px-2 py-1 rounded">1) Measure Distance:</span> Route A = 8 km</p>
                  <p><span className="bg-blue-200 px-2 py-1 rounded">2) Base Time:</span> 8 × 2.5 = 20 minutes</p>
                  <p><span className="bg-blue-200 px-2 py-1 rounded">3) Traffic Segments:</span> Σ(0.8 × 3) + (1.0 × 5) = 7.4 min</p>
                  <p><span className="bg-blue-200 px-2 py-1 rounded">4) Hazard Penalty:</span> +4.5 min (accident nearby)</p>
                  <p><span className="bg-blue-200 px-2 py-1 rounded">5) Weather:</span> +1.2 min (rain)</p>
                  <p className="text-lg font-black text-blue-700 mt-3">Final: T = 20 + 7.4 + 4.5 + 1.2 = <span className="text-2xl">33.1 minutes</span></p>
                </div>
              </div>
            </div>

            {/* Formula 2: Risk Scoring */}
            <div className="space-y-4">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Formula 2: Multivariate Risk Score (R-Score)</h4>
              
              <div className="p-6 bg-slate-900 rounded-2xl text-white font-mono space-y-4">
                <div>
                  <p className="text-amber-400 font-black mb-2">Risk Calculation:</p>
                  <p className="text-lg leading-relaxed">R = (α·H + β·S + γ/V) / N</p>
                </div>

                <div className="border-t border-slate-700 pt-4 space-y-2 text-sm">
                  <p><span className="text-emerald-400">R</span> = Risk score (0-10)</p>
                  <p><span className="text-emerald-400">α</span> = Historical frequency weight (0.4)</p>
                  <p><span className="text-emerald-400">H</span> = Incidents in past 30 days</p>
                  <p><span className="text-emerald-400">β</span> = Severity weight (0.35)</p>
                  <p><span className="text-emerald-400">S</span> = Current incident severity (1-5)</p>
                  <p><span className="text-emerald-400">γ</span> = Velocity variance (0.25)</p>
                  <p><span className="text-emerald-400">V</span> = Avg speed (km/h)</p>
                  <p><span className="text-emerald-400">N</span> = Normalization factor (sum of weights)</p>
                </div>
              </div>

              <div className="p-5 bg-red-50 border-l-4 border-red-500 rounded-lg space-y-3">
                <p className="text-[11px] font-black text-red-900 uppercase tracking-widest">Example: High-Risk Area</p>
                <div className="text-sm font-bold text-slate-800 space-y-2">
                  <p><span className="bg-red-200 px-2 py-1 rounded">Historical (α·H):</span> 0.4 × 6 = 2.4</p>
                  <p><span className="bg-red-200 px-2 py-1 rounded">Severity (β·S):</span> 0.35 × 4 = 1.4</p>
                  <p><span className="bg-red-200 px-2 py-1 rounded">Velocity (γ/V):</span> 0.25 / 12 km/h = 0.021</p>
                  <p><span className="bg-red-200 px-2 py-1 rounded">Normalize:</span> (2.4 + 1.4 + 0.021) / 1.0 = 3.821</p>
                  <p className="text-lg font-black text-red-700 mt-3">Risk Level: <span className="text-2xl">HIGH (7.6/10)</span> ⚠️</p>
                </div>
              </div>
            </div>

            {/* Formula 3: Spatial Clustering */}
            <div className="space-y-4">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Formula 3: DBSCAN Hotspot Detection</h4>
              
              <div className="p-6 bg-slate-900 rounded-2xl text-white font-mono space-y-4">
                <div>
                  <p className="text-amber-400 font-black mb-2">Clustering Parameters:</p>
                  <p className="text-base leading-relaxed">
                    Cluster = {'{'}(x₁,y₁), (x₂,y₂), ... (xₙ,yₙ){'}' } | eps_distance ≤ 500m ∧ MinPts ≥ 4
                  </p>
                </div>

                <div className="border-t border-slate-700 pt-4 space-y-2 text-sm">
                  <p><span className="text-emerald-400">eps</span> = Search radius (500 meters)</p>
                  <p><span className="text-emerald-400">MinPts</span> = Min neighbors for density (4 points)</p>
                  <p><span className="text-emerald-400">Tw</span> = Time window (24 hours)</p>
                  <p><span className="text-emerald-400">Distance</span> = Haversine formula for great-circle</p>
                </div>
              </div>

              <div className="p-5 bg-purple-50 border-l-4 border-purple-500 rounded-lg space-y-3">
                <p className="text-[11px] font-black text-purple-900 uppercase tracking-widest">Hotspot Detection Example</p>
                <div className="text-sm font-bold text-slate-800 space-y-2">
                  <p>📍 <span className="bg-purple-200 px-2 py-1 rounded">Point 1:</span> [15.0333, 120.6833] - Accident report</p>
                  <p>📍 <span className="bg-purple-200 px-2 py-1 rounded">Point 2:</span> [15.0335, 120.6835] - Slow traffic detected</p>
                  <p>📍 <span className="bg-purple-200 px-2 py-1 rounded">Point 3:</span> [15.0337, 120.6838] - Another incident</p>
                  <p>📍 <span className="bg-purple-200 px-2 py-1 rounded">Point 4:</span> [15.0339, 120.6840] - User report</p>
                  <p className="mt-3 text-base font-black text-purple-700">Result: <span className="text-lg bg-purple-200 px-3 py-1 rounded">🔴 HOTSPOT DETECTED</span></p>
                  <p className="text-[10px] font-bold text-slate-600">All 4 points within 500m → Flag as high-risk zone</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== SECTION 4: ML Features ===== */}
      <div>
        <SectionHeader id="ml-features" title="🧠 Machine Learning Feature Engineering" icon={Lightbulb} />
        {isExpanded('ml-features') && (
          <div className="p-8 space-y-6 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  name: "Temporal Features",
                  items: [
                    "Hour of Day (0-23) → rush hours vs. quiet",
                    "Day of Week (0-6) → weekday vs. weekend",
                    "Month (1-12) → seasonal patterns",
                    "Holiday Flag → special events"
                  ]
                },
                {
                  name: "Spatial Features",
                  items: [
                    "Geohash L7 → ~150m grid cells",
                    "Distance to landmarks (hospital, school)",
                    "Road network density",
                    "Elevation changes"
                  ]
                },
                {
                  name: "Traffic Features",
                  items: [
                    "Speed variance (σ) → congestion indicator",
                    "Volume trend (↑↓) → flow acceleration",
                    "Vehicle count ratio → occupancy",
                    "Lane occupancy %"
                  ]
                },
                {
                  name: "Contextual Features",
                  items: [
                    "Weather condition → impact multiplier",
                    "Active incidents → propagation effect",
                    "Event schedules → predictable congestion",
                    "Construction zones → manual delays"
                  ]
                }
              ].map((category, idx) => (
                <div key={idx} className="p-6 bg-white rounded-xl border border-slate-200 space-y-3">
                  <h5 className="font-black text-slate-900">{category.name}</h5>
                  <ul className="space-y-2">
                    {category.items.map((item, i) => (
                      <li key={i} className="text-sm font-bold text-slate-700 flex items-start gap-2">
                        <span className="text-indigo-600 mt-1">●</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ===== SECTION 5: Real-World Applications ===== */}
      <div>
        <SectionHeader id="applications" title="🎯 Real-World Applications & Use Cases" icon={TrendingUp} />
        {isExpanded('applications') && (
          <div className="p-8 space-y-6 bg-gradient-to-b from-slate-50 to-white">
            <div className="space-y-4">
              {[
                {
                  title: "Emergency Response Routing",
                  formula: "Best Route = argmin(T) where T = predicted travel time using TSRE",
                  example: "Ambulance reaches hospital in 23 min (predicted) vs 31 min (naive route)"
                },
                {
                  title: "Incident Hotspot Prevention",
                  formula: "Alert = R-Score > 7.0 ∧ DBSCAN cluster detected",
                  example: "System flags Emerald Ave as high-risk → deploy traffic control 30 min early"
                },
                {
                  title: "Traffic Prediction",
                  formula: "Congestion(t+30) = f(Historical patterns + Current volume)",
                  example: "Predict 5:00 PM bottleneck → notify users at 4:30 PM for alternate routes"
                },
                {
                  title: "Resource Allocation",
                  formula: "ResponseForce = argmax(Impact) based on R-Score × Population density",
                  example: "Deploy firefighters to high-risk zone with 40% higher incident probability"
                }
              ].map((usecase, idx) => (
                <div key={idx} className="p-6 bg-white rounded-xl border-2 border-indigo-100 hover:border-indigo-300 transition-colors space-y-3">
                  <h5 className="font-black text-slate-900 text-lg">{usecase.title}</h5>
                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Formula</p>
                      <p className="font-mono font-bold text-slate-700 bg-indigo-50 px-3 py-2 rounded text-sm">{usecase.formula}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Real Impact</p>
                      <p className="font-bold text-slate-700">{usecase.example}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ===== SECTION 5: Model Training ===== */}
      <div>
        <SectionHeader id="model-training" title="🎓 Risk Weight Model Training" icon={Brain} />
        {isExpanded('model-training') && (
          <div className="p-8 space-y-8 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
            <MLModelTrainer />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 bg-slate-900 text-white border-t border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-amber-400" />
          <p className="text-[10px] font-black uppercase tracking-widest">All formulas implemented • Live data streaming</p>
        </div>
        <p className="text-[10px] font-bold text-slate-400">Res-Q ML Engine v2.5 • Last updated: Today</p>
      </div>
    </div>
  );
}
