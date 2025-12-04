
import React, { useState, useEffect } from 'react';
import { Building, Location, Asset, Priority } from '../types';
import { 
  getCampuses, getBuildings, getLocations, getAssets, submitTicket, addLocation, addAsset 
} from '../services/dataService';
import { analyzeTicketPriority, refineTicketDescription } from '../services/geminiService';
import { Send, Loader2, Sparkles, Wand2, PlusCircle } from 'lucide-react';

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

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setIsAnalyzing(false);
  };

  const handleRequestNew = (type: 'Location' | 'Asset') => {
    const name = prompt(`Enter name for new ${type}:`);
    if (!name) return;

    if (type === 'Location' && buildingId) {
      addLocation(buildingId, name + " (Requested)");
      setLocations(getLocations(buildingId)); // refresh
      // auto-select last added logic omitted for brevity, user can select from dropdown
    } else if (type === 'Asset' && locationId) {
      addAsset(locationId, name + " (Requested)");
      setAssets(getAssets(locationId));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    setTimeout(() => {
      submitTicket(userEmail, {
        campusId,
        buildingId,
        locationId,
        assetId,
        category: department,
        title,
        description,
        priority: suggestedPriority || Priority.MEDIUM
      });
      setIsSubmitting(false);
      onSuccess();
    }, 800);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-[#355E3B]">
      <h2 className="text-2xl font-bold text-[#355E3B] mb-6 flex items-center gap-2">
        <span className="bg-[#FFD700] w-2 h-8 rounded-sm"></span>
        New Ticket Submission
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Department</label>
          <div className="flex gap-4">
            <label className={`flex-1 p-3 rounded-lg border-2 cursor-pointer transition-all ${department === 'IT' ? 'border-[#355E3B] bg-green-50 text-[#355E3B]' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="radio" name="dept" value="IT" checked={department === 'IT'} onChange={() => setDepartment('IT')} className="hidden" />
              <div className="text-center font-bold">IT Support</div>
            </label>
            <label className={`flex-1 p-3 rounded-lg border-2 cursor-pointer transition-all ${department === 'Facilities' ? 'border-[#355E3B] bg-green-50 text-[#355E3B]' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="radio" name="dept" value="Facilities" checked={department === 'Facilities'} onChange={() => setDepartment('Facilities')} className="hidden" />
              <div className="text-center font-bold">Facilities</div>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campus</label>
            <select 
              required
              value={campusId} 
              onChange={e => setCampusId(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#355E3B] focus:outline-none"
            >
              <option value="">-- Select Campus --</option>
              {getCampuses().map(c => (
                <option key={c.CampusID} value={c.CampusID}>{c.Campus_Name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Building</label>
            <select 
              required
              disabled={!campusId}
              value={buildingId} 
              onChange={e => setBuildingId(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#355E3B] focus:outline-none disabled:bg-gray-100"
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
              <label className="block text-sm font-medium text-gray-700">Specific Location</label>
              {buildingId && (
                <button type="button" onClick={() => handleRequestNew('Location')} className="text-xs text-[#355E3B] hover:underline flex items-center gap-1">
                  <PlusCircle className="w-3 h-3" /> Not listed?
                </button>
              )}
            </div>
            <select 
              required
              disabled={!buildingId}
              value={locationId} 
              onChange={e => setLocationId(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#355E3B] focus:outline-none disabled:bg-gray-100"
            >
              <option value="">-- Select Location --</option>
              {locations.map(l => (
                <option key={l.LocationID} value={l.LocationID}>{l.Location_Name}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Related Asset (Optional)</label>
              {locationId && (
                <button type="button" onClick={() => handleRequestNew('Asset')} className="text-xs text-[#355E3B] hover:underline flex items-center gap-1">
                  <PlusCircle className="w-3 h-3" /> Not listed?
                </button>
              )}
            </div>
            <select 
              disabled={!locationId}
              value={assetId} 
              onChange={e => setAssetId(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#355E3B] focus:outline-none disabled:bg-gray-100"
            >
              <option value="">-- Select Asset --</option>
              {assets.map(a => (
                <option key={a.AssetID} value={a.AssetID}>{a.Asset_Name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Issue Title</label>
          <input 
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#355E3B] focus:outline-none"
            placeholder="e.g., Broken Outlet"
          />
        </div>

        <div>
          <div className="flex justify-between items-end mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Full Description 
              <span className="text-xs font-normal text-gray-500 ml-2">(Be specific)</span>
            </label>
            <button
              type="button"
              onClick={handleRefineDescription}
              disabled={!description || isAnalyzing}
              className="text-xs flex items-center gap-1 text-[#355E3B] hover:text-green-700 underline decoration-dotted disabled:opacity-50"
            >
              {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
              AI Polish
            </button>
          </div>
          <div className="relative">
            <textarea 
              required
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#355E3B] focus:outline-none"
              placeholder="Describe the issue in detail..."
            />
            
            <button
              type="button"
              onClick={handleSmartAnalysis}
              disabled={!description || isAnalyzing}
              className="absolute bottom-3 right-3 flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors border border-indigo-200 disabled:opacity-50"
            >
              {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {isAnalyzing ? 'Analyzing...' : 'Smart Triage'}
            </button>
          </div>

          {suggestedPriority && (
            <div className="mt-3 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
              <span className="text-sm text-gray-500">AI Suggested Priority:</span>
              <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wide
                ${suggestedPriority === Priority.CRITICAL ? 'bg-red-100 text-red-800' : 
                  suggestedPriority === Priority.HIGH ? 'bg-orange-100 text-orange-800' : 
                  'bg-blue-100 text-blue-800'}`}>
                {suggestedPriority}
              </span>
            </div>
          )}
        </div>

        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#355E3B] text-white py-3 rounded-md font-semibold hover:bg-[#2a4b2f] transition-colors flex justify-center items-center gap-2 shadow-lg"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          Submit Ticket
        </button>

      </form>
    </div>
  );
};

export default TicketForm;
