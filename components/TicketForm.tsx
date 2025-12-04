import React, { useState } from 'react';
import { Department, Campus, Priority, TicketStatus } from '../types';
import { submitTicket } from '../services/ticketService';
import { analyzeTicketPriority } from '../services/geminiService';
import { Loader2, Sparkles } from 'lucide-react';

interface Props {
  userEmail: string;
  onSuccess: () => void;
}

const TicketForm: React.FC<Props> = ({ userEmail, onSuccess }) => {
  const [department, setDepartment] = useState<Department>(Department.IT);
  const [campus, setCampus] = useState<Campus>(Campus.MADISON_AVE);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestedPriority, setSuggestedPriority] = useState<Priority | null>(null);

  const handleSmartAnalysis = async () => {
    if (!description) return;
    setIsAnalyzing(true);
    const result = await analyzeTicketPriority(description, department);
    setSuggestedPriority(result);
    setIsAnalyzing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Slight delay to mimic network request
    setTimeout(() => {
      submitTicket({
        requestorEmail: userEmail,
        department,
        campus,
        locationDetails: location,
        description,
        priority: suggestedPriority || Priority.MEDIUM,
        assignedTo: undefined
      });
      setIsSubmitting(false);
      // Reset form
      setLocation('');
      setDescription('');
      setSuggestedPriority(null);
      onSuccess();
    }, 800);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-hunter-green">
      <h2 className="text-2xl font-bold text-hunter-green mb-6">Submit New Ticket</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select 
              value={department}
              onChange={(e) => setDepartment(e.target.value as Department)}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#355E3B] focus:outline-none"
            >
              <option value={Department.IT}>IT Support</option>
              <option value={Department.FACILITIES}>Facilities/Maintenance</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campus</label>
            <select 
              value={campus}
              onChange={(e) => setCampus(e.target.value as Campus)}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#355E3B] focus:outline-none"
            >
              <option value={Campus.MADISON_AVE}>Madison Ave</option>
              <option value={Campus.MILL_ST}>Mill St</option>
              <option value={Campus.OTHER}>Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location Details (Room/Area)</label>
          <input 
            type="text" 
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#355E3B] focus:outline-none"
            placeholder="e.g. Room 304, Gym, Front Office"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description of Issue</label>
          <div className="relative">
            <textarea 
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-[#355E3B] focus:outline-none"
              placeholder="Please describe the issue in detail..."
            />
            <button
              type="button"
              onClick={handleSmartAnalysis}
              disabled={!description || isAnalyzing}
              className="absolute bottom-2 right-2 flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full hover:bg-indigo-100 transition-colors"
            >
              {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {isAnalyzing ? 'Analyzing...' : 'Smart Triage'}
            </button>
          </div>
          {suggestedPriority && (
            <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
              <span className="text-gray-500">Suggested Priority:</span>
              <span className={`font-semibold px-2 py-0.5 rounded text-xs
                ${suggestedPriority === Priority.CRITICAL ? 'bg-red-100 text-red-800' : 
                  suggestedPriority === Priority.HIGH ? 'bg-orange-100 text-orange-800' : 
                  'bg-blue-100 text-blue-800'}`}>
                {suggestedPriority}
              </span>
            </div>
          )}
        </div>

        <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 text-sm text-yellow-800">
          <strong>Workflow Note:</strong> 
          {department === Department.IT && " IT tickets are automatically assigned 'New' status."}
          {department === Department.FACILITIES && (campus === Campus.MADISON_AVE || campus === Campus.MILL_ST) && " Facilities tickets for this campus require Principal approval."}
          {department === Department.FACILITIES && campus === Campus.OTHER && " Ticket will be created as 'New'."}
        </div>

        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#355E3B] text-white py-2 px-4 rounded-md font-semibold hover:bg-[#2a4b2f] transition-colors flex justify-center items-center gap-2"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Ticket'}
        </button>
      </form>
    </div>
  );
};

export default TicketForm;
