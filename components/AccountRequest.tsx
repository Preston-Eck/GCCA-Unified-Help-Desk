import React, { useState } from 'react';
import { submitTicket } from '../services/dataService';
import { UserPlus, ArrowLeft, Send, AlertCircle } from 'lucide-react';

interface AccountRequestProps {
  onBack: () => void;
  onSuccess: () => void;
}

const AccountRequest: React.FC<AccountRequestProps> = ({ onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    department: '',
    role: '',
    supervisor: '',
    mirrorUser: '',
    systems: [] as string[],
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const formattedDescription = `
New Account Request Details:
----------------------------
Name: ${formData.firstName} ${formData.lastName}
Department: ${formData.department}
Role: ${formData.role}
Supervisor: ${formData.supervisor}
Mirror User (Copy Permissions): ${formData.mirrorUser || 'N/A'}

Additional Notes:
${formData.notes || 'None'}
      `.trim();

      // FIXED: Added 'Tickets' as the first argument (List Name)
      // The second argument is the data object.
      await submitTicket('Tickets', {
        title: `Account Request: ${formData.firstName} ${formData.lastName}`,
        description: formattedDescription,
        type: 'Access',
        priority: 'Medium',
        status: 'Open'
      });

      onSuccess();
    } catch (err) {
      console.error('Failed to submit account request:', err);
      setError('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-3xl mx-auto">
      <button 
        onClick={onBack}
        className="mb-6 flex items-center text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserPlus className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">New Account Request</h2>
          </div>
          <p className="text-slate-600">
            Submit a request for new user access or system permissions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Department *
              </label>
              <input
                type="text"
                name="department"
                required
                value={formData.department}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Job Role / Title *
              </label>
              <input
                type="text"
                name="role"
                required
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Supervisor *
              </label>
              <input
                type="text"
                name="supervisor"
                required
                value={formData.supervisor}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mirror User (Optional)
              </label>
              <input
                type="text"
                name="mirrorUser"
                placeholder="Copy permissions from..."
                value={formData.mirrorUser}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
              <p className="mt-1 text-xs text-slate-500">
                Specify an existing user to copy permissions from.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Additional Notes
            </label>
            <textarea
              name="notes"
              rows={4}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any specific systems, software, or hardware requirements..."
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm hover:shadow"
            >
              {isSubmitting ? (
                <>Processing...</>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountRequest;