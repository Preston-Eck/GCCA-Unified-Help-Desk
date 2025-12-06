import React, { useState } from 'react';
import { requestOtp, verifyOtp } from '../services/dataService';
import { LogIn, Send, Lock, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

interface Props {
  onLogin: (email: string) => void;
}

const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const [step, setStep] = useState<'EMAIL' | 'CODE'>('EMAIL');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await requestOtp(email);
      if (result && result.success) {
        setStep('CODE');
      } else {
        setError(result?.message || "Failed to send code. Is your email in the User list?");
      }
    } catch (err) {
      setError("System error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const isValid = await verifyOtp(email, code);
      if (isValid) {
        onLogin(email);
      } else {
        setError("Invalid or expired code.");
      }
    } catch (err) {
      setError("Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full border-t-8 border-[#355E3B]">
        <div className="text-center mb-6">
          <div className="mx-auto bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-[#355E3B]" />
          </div>
          <h1 className="text-2xl font-bold text-[#355E3B]">Secure Login</h1>
          <p className="text-gray-500 mt-2 text-sm">
            {step === 'EMAIL' ? "Please confirm your identity." : "Enter the code sent to your email."}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {step === 'EMAIL' ? (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address</label>
              <input 
                type="email" 
                required
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#355E3B] focus:outline-none"
                placeholder="name@grovecitychristianacademy.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#355E3B] text-white font-bold py-3 rounded-lg hover:bg-green-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Send Verification Code
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">6-Digit Code</label>
              <input 
                type="text" 
                required
                maxLength={6}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#355E3B] focus:outline-none text-center text-2xl font-mono tracking-widest"
                placeholder="123456"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g,''))}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#355E3B] text-white font-bold py-3 rounded-lg hover:bg-green-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
              Verify & Login
            </button>
            <button 
              type="button" 
              onClick={() => { setStep('EMAIL'); setError(''); }}
              className="w-full text-gray-500 text-sm hover:underline"
            >
              Back to Email
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;