import React, { useState, useEffect } from 'react';
import { Building, Location, Asset, Priority, SOP } from '../types';
import { 
  getCampuses, getBuildings, getLocations, getAssets, submitTicket, addLocation, addAsset, getSOPsForAsset, uploadFile 
} from '../services/dataService';
import { analyzeTicketPriority, refineTicketDescription } from '../services/geminiService';
import { Send, Loader2, Wand2, PlusCircle, UploadCloud, X, FileText, Lightbulb } from 'lucide-react';

interface Props {
  userEmail: string;
  onSuccess: () => void;
}

const TicketForm: React.FC<Props> = ({ userEmail, onSuccess }) => {
  const [department, setDepartment] = useState<'IT' | 'Facilities'>('IT');
  const [campusId, setCampusId] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [assetId, setAssetId] = useState('');
  
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [sops, setSops] = useState<SOP[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // File State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestedPriority, setSuggestedPriority] = useState<Priority | null>(null);

  // Cascading Effects
  useEffect(() => {
    setBuildingId(''); setLocationId(''); setAssetId('');
    if (campusId) setBuildings(getBuildings(campusId));
    else setBuildings([]);
  }, [campusId]);

  useEffect(() => {
    setLocationId(''); setAssetId('');
    if (buildingId) setLocations(getLocations(buildingId));
    else setLocations([]);
  }, [buildingId]);

  useEffect(() => {
    setAssetId('');
    if (locationId) setAssets(getAssets(locationId));
    else setAssets([]);
  }, [locationId]);

  // Smart Asset Logic
  useEffect(() => {
    setSops([]);
    if (assetId) {
      const foundSops = getSOPsForAsset(assetId);
      setSops(foundSops);
    }
  }, [assetId]);

  const handleSmartAnalysis = async () => {
    if (!description) return;
    setIsAnalyzing(true);
    const result = await analyzeTicketPriority(description, department);
    setSuggestedPriority(result);
    setIsAnalyzing(false);
  };

  const handleRefineDescription = async () => {
    if (!description) return;
    setIsAnalyzing(true);
    const polishedText = await refineTicketDescription(description, department);
    setDescription(polishedText); 
    // Auto-triage after polish
    const priority = await analyzeTicketPriority(polishedText, department);
    setSuggestedPriority(priority);
    setIsAnalyzing(false);
  };

  // --- FILE HANDLERS ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRequestNew = (type: 'Location' | 'Asset') => {
    const name = prompt(`Enter name for new ${type}:`);
    if (!name) return;

    if (type === 'Location' && buildingId) {
      addLocation(buildingId, name + " (Requested)");
      setLocations(getLocations(buildingId)); 
    } else if (type === 'Asset' && locationId) {
      addAsset(locationId, name + " (Requested)");
      setAssets(getAssets(locationId));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUploadProgress('');

    try {
      // 1. Submit the Ticket Data
      const ticketId = await submitTicket(userEmail, {
        campusId,
        buildingId,
        locationId,
        assetId,
        category: department,
        title,
        description,
        priority: suggestedPriority || Priority.MEDIUM,
      });

      // 2. Upload Files if ticket created successfully
      if (ticketId && selectedFiles.length > 0) {
        setUploadProgress(`Uploading ${selectedFiles.length} file(s)...`);
        
        // Upload sequentially to avoid overwhelming server or rate limits
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          setUploadProgress(`Uploading ${i + 1}/${selectedFiles.length}: ${file.name}`);
          await uploadFile(file, ticketId);
        }
      }

      onSuccess();
    } catch (error) {
      console.error("Submission failed", error);
      alert("Failed to submit ticket. Please check your connection.");
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl border-t-4 border-[#355E3B]">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-bold text-[#355E3B] flex items-center gap-2">
          <span className="bg-[#FFD700] w-2 h-8 rounded-sm"></span>
          New Ticket Submission
        </h2>
        <div className="text-xs text-gray-500 text-right">
          Logged in as:<br/>
          <span className="font-semibold text-gray-700">{userEmail}</span>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Department Selection */}
        <div className="grid grid-cols-2 gap-4">
          <label className={`relative flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${department === 'IT' ? 'border-[#355E3B] bg-green-50 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
            <input type="radio" name="dept" value="IT" checked={department === 'IT'} onChange={() => setDepartment('IT')} className="hidden" />
            <div className="text-center">
              <span className="block text-xl">💻</span>
              <span className={`font-bold ${department === 'IT' ? 'text-[#355E3B]' : 'text-gray-500'}`}>IT Support</span>
            </div>
          </label>
          <label className={`relative flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${department === 'Facilities' ? 'border-[#355E3B] bg-green-50 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
            <input type="radio" name="dept" value="Facilities" checked={department === 'Facilities'} onChange={() => setDepartment('Facilities')} className="hidden" />
            <div className="text-center">
              <span className="block text-xl">🔧</span>
              <span className={`font-bold ${department === 'Facilities' ? 'text-[#355E3B]' : 'text-gray-500'}`}>Facilities</span>
            </div>
          </label>
        </div>

        <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Location Context</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Campus</label>
              <select 
                required
                value={campusId} 
                onChange={e => setCampusId(e.target.value)}
                className="w-full text-sm border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#355E3B] focus:border-[#355E3B] bg-white shadow-sm"
              >
                <option value="">-- Select Campus --</option>
                {getCampuses().map(c => (
                  <option key={c.CampusID} value={c.CampusID}>{c.Campus_Name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Building</label>
              <select 
                required
                disabled={!campusId}
                value={buildingId} 
                onChange={e => setBuildingId(e.target.value)}
                className="w-full text-sm border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#355E3B] focus:border-[#355E3B] bg-white shadow-sm disabled:bg-gray-100"
              >
                <option value="">-- Select Building --</option>
                {buildings.map(b => (
                  <option key={b.BuildingID} value={b.BuildingID}>{b.Building_Name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between mb-1">
                <label className="block text-xs font-bold text-gray-700">Specific Location</label>
                {buildingId && (
                  <button type="button" onClick={() => handleRequestNew('Location')} className="text-[10px] text-[#355E3B] hover:underline flex items-center gap-1">
                    <PlusCircle className="w-3 h-3" /> Add New
                  </button>
                )}
              </div>
              <select 
                required
                disabled={!buildingId}
                value={locationId} 
                onChange={e => setLocationId(e.target.value)}
                className="w-full text-sm border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#355E3B] focus:border-[#355E3B] bg-white shadow-sm disabled:bg-gray-100"
              >
                <option value="">-- Select Location --</option>
                {locations.map(l => (
                  <option key={l.LocationID} value={l.LocationID}>{l.Location_Name}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="block text-xs font-bold text-gray-700">Related Asset (Optional)</label>
                {locationId && (
                  <button type="button" onClick={() => handleRequestNew('Asset')} className="text-[10px] text-[#355E3B] hover:underline flex items-center gap-1">
                    <PlusCircle className="w-3 h-3" /> Add New
                  </button>
                )}
              </div>
              <select 
                disabled={!locationId}
                value={assetId} 
                onChange={e => setAssetId(e.target.value)}
                className="w-full text-sm border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#355E3B] focus:border-[#355E3B] bg-white shadow-sm disabled:bg-gray-100"
              >
                <option value="">-- Select Asset --</option>
                {assets.map(a => (
                  <option key={a.AssetID} value={a.AssetID}>{a.Asset_Name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Smart Asset SOP Alert */}
          {sops.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 animate-in slide-in-from-top-2">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-800">Troubleshooting Tips Found!</h4>
                  <p className="text-xs text-amber-700 mb-2">Before submitting, please try these steps:</p>
                  <ul className="list-disc list-inside text-xs text-amber-900 space-y-1">
                    {sops.map(sop => (
                      <li key={sop.SOP_ID}>
                        <span className="font-semibold">{sop.SOP_Title}:</span> {sop.Concise_Procedure_Text}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Details Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Issue Title</label>
            <input 
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full border-gray-300 rounded-lg p-3 shadow-sm focus:ring-2 focus:ring-[#355E3B] focus:border-transparent"
              placeholder="e.g., Projector is flickering"
            />
          </div>

          <div>
            <div className="flex justify-between items-end mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <button
                type="button"
                onClick={handleRefineDescription}
                disabled={!description || isAnalyzing}
                className="text-xs flex items-center gap-1 text-[#355E3B] bg-green-50 px-2 py-1 rounded hover:bg-green-100 transition-colors disabled:opacity-50"
              >
                {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                AI Polish & Triage
              </button>
            </div>
            <textarea 
              required
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full border-gray-300 rounded-lg p-3 shadow-sm focus:ring-2 focus:ring-[#355E3B] focus:border-transparent transition-all"
              placeholder="Describe what happened, where, and when..."
            />
            
            {/* AI Priority Feedback */}
            {suggestedPriority && (
              <div className="mt-2 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <span className="text-xs text-gray-500">AI Suggested Priority:</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide
                  ${suggestedPriority === Priority.CRITICAL ? 'bg-red-100 text-red-800' : 
                    suggestedPriority === Priority.HIGH ? 'bg-orange-100 text-orange-800' : 
                    'bg-blue-100 text-blue-800'}`}>
                  {suggestedPriority}
                </span>
              </div>
            )}
          </div>

          {/* File Upload Section */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <UploadCloud className="w-4 h-4" /> Attachments
            </label>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-white hover:bg-gray-50 transition-colors relative">
              <input 
                type="file" 
                multiple
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <UploadCloud className="w-10 h-10 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-600">Click or Drag files here</p>
              <p className="text-xs text-gray-400">Support images, PDFs, Docs</p>
            </div>

            {/* Selected File List */}
            {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-white border border-gray-200 px-3 py-2 rounded text-sm shadow-sm">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-4 h-4 text-gray-500 shrink-0" />
                      <span className="truncate max-w-xs">{file.name}</span>
                      <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(0)}kb)</span>
                    </div>
                    <button type="button" onClick={() => removeFile(index)} className="text-red-400 hover:text-red-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#355E3B] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#2a4b2f] transition-all shadow-lg hover:shadow-xl flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
          {isSubmitting ? (uploadProgress || 'Submitting...') : 'Submit Ticket'}
        </button>

      </form>
    </div>
  );
};

export default TicketForm;