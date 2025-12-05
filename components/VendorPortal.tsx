
import React, { useState, useEffect } from 'react';
import { getOpenTicketsForVendors, submitBid, registerVendor, getVendorTickets } from '../services/dataService';
import { Ticket, TicketStatus } from '../types';
import { ClipboardList, Send, UserPlus, DollarSign, History, Archive, Briefcase, Paperclip, X } from 'lucide-react';

const VendorPortal: React.FC = () => {
  const [view, setView] = useState<'LOGIN' | 'TICKETS' | 'HISTORY' | 'REGISTER'>('LOGIN');
  const [vendorName, setVendorName] = useState('Rapid Plumbers'); // Simulated session
  const [vendorId, setVendorId] = useState('V1'); // Simulated ID
  const [openTickets, setOpenTickets] = useState<Ticket[]>([]);
  const [myProjects, setMyProjects] = useState<Ticket[]>([]);
  
  // Registration Form
  const [regForm, setRegForm] = useState({ company: '', contact: '', email: '', phone: '', type: 'Facilities' });

  // Bidding
  const [bidAmount, setBidAmount] = useState('');
  const [bidNotes, setBidNotes] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [bidFiles, setBidFiles] = useState<File[]>([]);

  useEffect(() => {
    if (view === 'TICKETS') {
      setOpenTickets(getOpenTicketsForVendors());
    }
    if (view === 'HISTORY') {
      setMyProjects(getVendorTickets(vendorId));
    }
  }, [view, vendorId]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerVendor({
      CompanyName: regForm.company,
      ContactName: regForm.contact,
      Email: regForm.email,
      Phone: regForm.phone,
      ServiceType: regForm.type as any
    });
    alert("Registration submitted! Pending approval.");
    setView('LOGIN');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setBidFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
    }
  };

  const removeFile = (index: number) => {
    setBidFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitBid = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTicket) {
      submitBid(vendorId, selectedTicket, parseFloat(bidAmount), bidNotes, bidFiles);
      alert("Bid placed successfully!");
      setSelectedTicket(null);
      setBidAmount('');
      setBidNotes('');
      setBidFiles([]);
      // Refresh list
      setOpenTickets(getOpenTicketsForVendors());
    }
  };

  const commonInputClass = "w-full p-2 border border-gray-300 rounded text-black bg-white focus:ring-2 focus:ring-[#355E3B] focus:outline-none";

  if (view === 'LOGIN') {
    return (
      <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-lg shadow-xl border-t-4 border-[#355E3B]">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Vendor Portal</h2>
        <div className="space-y-4">
          <button 
            onClick={() => setView('TICKETS')}
            className="w-full bg-[#355E3B] text-white py-3 rounded font-bold hover:bg-green-800 transition-colors"
          >
            Login as {vendorName} (Demo)
          </button>
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-sm">OR</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>
          <button 
            onClick={() => setView('REGISTER')}
            className="w-full border-2 border-[#355E3B] text-[#355E3B] py-3 rounded font-bold hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" /> New Vendor Registration
          </button>
        </div>
      </div>
    );
  }

  if (view === 'REGISTER') {
    return (
      <div className="max-w-lg mx-auto mt-10 bg-white p-8 rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold text-[#355E3B] mb-6">Vendor Registration</h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <input required placeholder="Company Name" className={commonInputClass} value={regForm.company} onChange={e => setRegForm({...regForm, company: e.target.value})} />
          <input required placeholder="Contact Person" className={commonInputClass} value={regForm.contact} onChange={e => setRegForm({...regForm, contact: e.target.value})} />
          <input required type="email" placeholder="Email" className={commonInputClass} value={regForm.email} onChange={e => setRegForm({...regForm, email: e.target.value})} />
          <input required placeholder="Phone" className={commonInputClass} value={regForm.phone} onChange={e => setRegForm({...regForm, phone: e.target.value})} />
          <select className={commonInputClass} value={regForm.type} onChange={e => setRegForm({...regForm, type: e.target.value})}>
            <option value="Facilities">Facilities</option>
            <option value="IT">IT</option>
            <option value="General">General</option>
          </select>
          <div className="flex gap-4 pt-4">
             <button type="button" onClick={() => setView('LOGIN')} className="w-1/3 border border-gray-300 p-2 rounded text-gray-600 bg-white">Cancel</button>
             <button type="submit" className="w-2/3 bg-[#355E3B] text-white p-2 rounded font-bold">Submit Application</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">
          {view === 'TICKETS' ? 'Open Opportunities' : 'My Project History'}
        </h1>
        <div className="flex items-center gap-3">
           <div className="flex bg-white rounded-lg shadow border border-gray-200 p-1">
             <button 
               onClick={() => setView('TICKETS')}
               className={`px-4 py-2 rounded font-medium text-sm flex items-center gap-2 ${view === 'TICKETS' ? 'bg-[#355E3B] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
             >
               <ClipboardList className="w-4 h-4" /> Open Bids
             </button>
             <button 
               onClick={() => setView('HISTORY')}
               className={`px-4 py-2 rounded font-medium text-sm flex items-center gap-2 ${view === 'HISTORY' ? 'bg-[#355E3B] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
             >
               <History className="w-4 h-4" /> My Projects
             </button>
           </div>
           <button onClick={() => setView('LOGIN')} className="text-sm text-gray-500 hover:text-gray-800 ml-2">Logout</button>
        </div>
      </div>

      {view === 'HISTORY' && (
        <div className="space-y-4">
           {myProjects.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-200">
                <Archive className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No project history found.</p>
                <p className="text-sm text-gray-400">Winning bids will appear here.</p>
              </div>
           ) : (
             myProjects.map(t => (
               <div key={t.TicketID} className="bg-white rounded-lg shadow border border-gray-200 p-6 flex justify-between items-center">
                 <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${t.Status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {t.Status}
                      </span>
                      <span className="text-sm text-gray-400">ID: {t.TicketID}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{t.Title}</h3>
                    <p className="text-gray-600 text-sm mt-1">{t.Description}</p>
                 </div>
                 <div className="text-right text-sm text-gray-500">
                    <div>Assigned: {new Date(t.Date_Submitted).toLocaleDateString()}</div>
                    <div className="font-medium text-[#355E3B] mt-1">{t.LocationID_Ref}</div>
                 </div>
               </div>
             ))
           )}
        </div>
      )}

      {view === 'TICKETS' && (
        <div className="grid gap-6">
          {openTickets.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500 font-medium">No tickets currently open for bidding.</p>
            </div>
          ) : (
            openTickets.map(t => (
              <div key={t.TicketID} className="bg-white rounded-lg shadow-md border border-gray-200 p-6 flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">{t.Category}</span>
                    <span className="text-sm text-gray-400">ID: {t.TicketID}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{t.Title}</h3>
                  <p className="text-gray-600 mb-4">{t.Description}</p>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>📍 {t.LocationID_Ref}</span>
                    <span>📅 {new Date(t.Date_Submitted).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="w-full md:w-96 bg-gray-50 p-4 rounded-lg border border-gray-100 shrink-0">
                  {selectedTicket === t.TicketID ? (
                    <form onSubmit={handleSubmitBid} className="space-y-3">
                      <h4 className="font-bold text-sm text-[#355E3B]">Submit Proposal</h4>
                      
                      <div className="relative">
                        <DollarSign className="w-4 h-4 absolute left-2 top-2.5 text-gray-400" />
                        <input 
                          type="number" 
                          required 
                          placeholder="0.00" 
                          className={`${commonInputClass} pl-8`}
                          value={bidAmount}
                          onChange={e => setBidAmount(e.target.value)}
                        />
                      </div>
                      
                      <textarea 
                        required 
                        placeholder="Notes / Timeframe..." 
                        className={commonInputClass}
                        rows={2}
                        value={bidNotes}
                        onChange={e => setBidNotes(e.target.value)}
                      />

                      {/* File Upload */}
                      <div className="border border-dashed border-gray-300 rounded bg-white p-3 text-center">
                         <div className="relative">
                           <input type="file" multiple onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                           <div className="flex flex-col items-center justify-center text-gray-500 gap-1">
                             <Paperclip className="w-4 h-4" />
                             <span className="text-xs">Attach Photos/Docs</span>
                           </div>
                         </div>
                         {bidFiles.length > 0 && (
                            <div className="mt-2 space-y-1 text-left">
                              {bidFiles.map((f, i) => (
                                <div key={i} className="flex justify-between items-center text-xs bg-gray-100 p-1 rounded">
                                  <span className="truncate max-w-[150px]">{f.name}</span>
                                  <button type="button" onClick={() => removeFile(i)} className="text-red-500"><X className="w-3 h-3"/></button>
                                </div>
                              ))}
                            </div>
                         )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button type="button" onClick={() => setSelectedTicket(null)} className="flex-1 text-xs text-gray-600 border border-gray-300 bg-white hover:bg-gray-50 rounded py-2">Cancel</button>
                        <button type="submit" className="flex-1 bg-[#355E3B] text-white text-xs py-2 rounded font-bold hover:bg-green-800">Send Bid</button>
                      </div>
                    </form>
                  ) : (
                    <button 
                      onClick={() => setSelectedTicket(t.TicketID)}
                      className="w-full bg-[#FFD700] text-black font-bold py-3 rounded shadow hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2"
                    >
                      <ClipboardList className="w-5 h-5" /> Place Bid
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default VendorPortal;
