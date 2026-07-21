
import React, { useState } from 'react';
import { User } from '../types';
import { database } from '../services/database';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (!name) throw new Error("Name is required");
        await database.auth.signup(email, password, name);
        setSuccess("Account created successfully! Please wait for admin approval.");
        setIsSignUp(false);
      } else {
        const user = await database.auth.login(email, password);
        if (user) {
          onLogin(user);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Check credentials and connection');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E9EBED] p-4 md:p-6">
      <div className="bg-white p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-white w-full max-w-lg relative overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="absolute top-0 right-0 w-48 h-48 bg-black/5 rounded-full -mr-24 -mt-24 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full -ml-24 -mb-24 blur-3xl"></div>

        <div className="text-center mb-8 md:mb-12 relative">
          <div className="inline-flex p-4 md:p-5 bg-black rounded-[1.2rem] md:rounded-[1.5rem] text-white mb-6 md:mb-8 shadow-xl">
             <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center font-extrabold text-xl md:text-2xl">R</div>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isSignUp ? 'Create Account' : 'RedMind Team CRM'}
          </h2>
          <p className="text-slate-400 text-[10px] mt-3 font-bold uppercase tracking-[0.2em]">
            {isSignUp ? 'Join the execution team' : 'Authorized Personnel Only'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-2xl flex items-center gap-2 animate-shake">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <span className="truncate">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in slide-in-from-top duration-300">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 relative">
          <div className="space-y-4">
            {isSignUp && (
              <input 
                required
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                disabled={isLoading}
                className="w-full px-6 md:px-8 py-4 md:py-5 rounded-2xl md:rounded-[1.5rem] bg-slate-50 border border-slate-100 focus:bg-white focus:border-black outline-none transition-all font-bold text-slate-800 text-sm disabled:opacity-50" 
              />
            )}
            <input 
              required
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              disabled={isLoading}
              className="w-full px-6 md:px-8 py-4 md:py-5 rounded-2xl md:rounded-[1.5rem] bg-slate-50 border border-slate-100 focus:bg-white focus:border-black outline-none transition-all font-bold text-slate-800 text-sm disabled:opacity-50" 
            />
            <input 
              required
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Security Key"
              disabled={isLoading}
              className="w-full px-6 md:px-8 py-4 md:py-5 rounded-2xl md:rounded-[1.5rem] bg-slate-50 border border-slate-100 focus:bg-white focus:border-black outline-none transition-all font-bold text-slate-800 text-sm disabled:opacity-50" 
            />
          </div>
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-black hover:scale-[1.02] active:scale-[0.98] text-white font-extrabold py-4 md:py-5 px-4 rounded-full transition-all duration-300 shadow-xl mt-4 text-sm disabled:bg-slate-400 disabled:scale-100"
          >
            {isLoading ? 'Processing...' : (isSignUp ? 'Request Access' : 'Access Dashboard')}
          </button>
        </form>

        <div className="mt-8 text-center text-xs font-bold text-slate-400">
          {isSignUp ? (
            <button onClick={() => setIsSignUp(false)} className="text-black hover:underline tracking-tight">Already have an account? Login</button>
          ) : (
            <button onClick={() => setIsSignUp(true)} className="text-black hover:underline tracking-tight">Need access? Create Account</button>
          )}
        </div>
        
        {/* Internal Footer Removed */}
      </div>
    </div>
  );
};

export default Login;
