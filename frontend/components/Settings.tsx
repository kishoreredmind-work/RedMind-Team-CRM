
import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import { User } from '../types';

interface SettingsProps {
  user: User;
  onUpdateUser: (data: Partial<User>) => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onUpdateUser }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email
  });
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser(formData);
    api.auth.updateProfile({ name: formData.name }).then(() => {
       alert('Settings updated successfully');
    });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordMessage('');
    if (passwordForm.next.length < 12) {
      setPasswordError('New password must be at least 12 characters.');
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordError('New passwords do not match.');
      return;
    }
    setIsChangingPassword(true);
    try {
      await database.auth.changePassword(passwordForm.current, passwordForm.next);
      setPasswordForm({ current: '', next: '', confirm: '' });
      setPasswordMessage('Password changed successfully.');
    } catch (error: any) {
      setPasswordError(error.message || 'Unable to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const publicUrl = await api.storage.uploadAvatar(file);
      await api.auth.updateProfile({ ...user, avatar: publicUrl });
      onUpdateUser({ avatar: publicUrl });
      alert('Profile picture updated!');
    } catch (error) {
      console.error("Upload failed", error);
      alert('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <h3 className="text-3xl font-black text-slate-900 tracking-tight">Account Settings</h3>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">MANAGE YOUR PROFILE AND SECURITY</p>
      </div>
      <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-slate-100 shadow-sm space-y-10">
         <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 text-center md:text-left">
            <div 
              className={`relative group cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
              onClick={handleAvatarClick}
            >
               <img 
                 src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} 
                 className="w-24 h-24 rounded-[2rem] object-cover border-4 border-slate-50 shadow-lg group-hover:brightness-50 transition-all"
                 alt="avatar"
               />
               <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-white font-black text-[10px] uppercase tracking-widest transition-opacity pointer-events-none">
                 {isUploading ? '...' : 'Change'}
               </div>
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 onChange={handleFileChange} 
                 className="hidden" 
                 accept="image/*"
               />
            </div>
            <div>
              <p className="text-xl font-black text-slate-900">{user.name}</p>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{user.role}</p>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                 <input 
                   value={formData.name} 
                   onChange={e => setFormData({...formData, name: e.target.value})}
                   className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:bg-white focus:border-black font-bold transition-all text-sm"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                 <input 
                   disabled
                   value={formData.email} 
                   className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold text-sm text-slate-400 cursor-not-allowed"
                 />
              </div>
           </div>

           <div className="pt-8 border-t border-slate-50 flex justify-end gap-4">
              <button type="submit" className="bg-black text-white px-10 py-4 rounded-full font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10">Save Changes</button>
           </div>
        </form>
      </div>

      <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-slate-100 shadow-sm">
        <h4 className="text-lg font-black text-slate-900 mb-1">Change Password</h4>
        <p className="text-sm font-bold text-slate-400 mb-6">Use at least 12 characters and never reuse a shared password.</p>
        {passwordError && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-xs font-bold text-red-600">{passwordError}</p>}
        {passwordMessage && <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-600">{passwordMessage}</p>}
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <input required type="password" minLength={12} autoComplete="current-password" placeholder="Current password" value={passwordForm.current} onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:bg-white focus:border-black font-bold text-sm" />
          <input required type="password" minLength={12} autoComplete="new-password" placeholder="New password" value={passwordForm.next} onChange={e => setPasswordForm({ ...passwordForm, next: e.target.value })} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:bg-white focus:border-black font-bold text-sm" />
          <input required type="password" minLength={12} autoComplete="new-password" placeholder="Confirm new password" value={passwordForm.confirm} onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:bg-white focus:border-black font-bold text-sm" />
          <button disabled={isChangingPassword} type="submit" className="bg-black text-white px-8 py-4 rounded-full font-black text-sm disabled:bg-slate-400">{isChangingPassword ? 'Updating...' : 'Change Password'}</button>
        </form>
      </div>

      <div className="bg-red-50/30 rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10 border border-red-100">
         <h4 className="text-lg font-black text-red-600 mb-4">Security Notice</h4>
         <p className="text-sm font-bold text-slate-600 leading-relaxed mb-6">Changing sensitive account details requires a full security audit as per company protocol. Please contact the IT administrator if you require access level changes.</p>
         <button className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-[0.2em] transition-colors underline underline-offset-4">Read Security Policy</button>
      </div>
    </div>
  );
};

export default Settings;
