
import React, { useState } from 'react';
import { submitAccountRequest } from '../services/dataService';
import { UserPlus, ArrowLeft, Send } from 'lucide-react';

interface Props {
  onBack: () => void;
}

const AccountRequest: React.FC<Props> = ({ onBack }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Parent',
    department: '',
    reason: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitAccountRequest({
      Name: formData.name,
      Email: formData.email,
      RequestedRole: formData.role,
      Department: formData.department,
      Reason: formData.reason
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg text-center border-t-4 border-[#355E3B]">
        <div className="mx-auto bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <Send className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-[#355E3B] mb-2">Request Submitted</h2>
        <p className="text-gray-600 mb-6">
          Your account request has been sent to the administration for approval. You will be notified via email once your account is active.
        </p>
        <button onClick={onBack} className="text-[#355E3B] font-bold hover:underline">
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-10 bg-white p-8 rounded-lg shadow-xl border-t-4 border-[#355E3B]">
      <button onClick={onBack} className="text-gray-500 hover:text-gray-800 flex items-center gap-1 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      
      <h2 className="text-2xl font-bold text-[#355E3B] mb-1 flex items-center gap-2">
        <UserPlus className="w-6 h-6" /> Request Account
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Please fill out the details below. This request will be reviewed by the board or administration.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
          <input required type="text" className="w-full border p-2 rounded focus:ring-[#355E3B]" 
            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
          <input required type="email" className="w-full border p-2 rounded focus:ring-[#355E3B]" 
            value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Requested Role</label>
            <select className="w-full border p-2 rounded" 
              value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
              <option value="Parent">Parent</option>
              <option value="Staff">Staff</option>
              <option value="Teacher">Teacher</option>
              <option value="Tech">Technician</option>
              <option value="Approver">Approver</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Department (If Staff)</label>
            <select className="w-full border p-2 rounded" 
              value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}>
              <option value="">-- None/Parent --</option>
              <option value="Academics">Academics</option>
              <option value="IT">IT</option>
              <option value="Facilities">Facilities</option>
              <option value="Administration">Administration</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reason for Access</label>
          <textarea required className="w-full border p-2 rounded h-24 focus:ring-[#355E3B]" 
            placeholder="e.g., I am a new parent wanting to monitor public tickets..."
            value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
        </div>

        <button type="submit" className="w-full bg-[#355E3B] text-white py-3 rounded font-bold hover:bg-green-800 transition-colors shadow-lg">
          Submit Request
        </button>
      </form>
    </div>
  );
};

export default AccountRequest;
