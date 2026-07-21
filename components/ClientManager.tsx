
import React, { useState } from 'react';
import { Client } from '../types';

interface ClientManagerProps {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  isAdmin: boolean;
  creationTrigger?: boolean;
}

const ClientManager: React.FC<ClientManagerProps> = ({ clients, setClients, isAdmin, creationTrigger }) => {
  const [showModal, setShowModal] = useState(false);

  // React to trigger
  React.useEffect(() => {
    if (creationTrigger) {
      resetForm();
      setShowModal(true);
    }
  }, [creationTrigger]);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({ name: '', company: '', email: '', phone: '', notes: '' });

  const resetForm = () => {
    setFormData({ name: '', company: '', email: '', phone: '', notes: '' });
    setEditingClient(null);
  };

  const handleAddOrEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      setClients(prev => prev.map(c => c.id === editingClient.id ? { ...editingClient, ...formData } : c));
    } else {
      const newClient: Client = { ...formData, id: `c${Date.now()}` };
      setClients(prev => [...prev, newClient]);
    }
    setShowModal(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete client profile?')) {
      setClients(prev => prev.filter(c => c.id !== id));
    }
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({ name: client.name, company: client.company, email: client.email, phone: client.phone, notes: client.notes });
    setShowModal(true);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight">Client Directory</h3>
          <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">ENTITY DATABASE MANAGEMENT</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className="w-full sm:w-auto bg-black text-white px-8 py-3 rounded-full hover:scale-105 transition-all font-bold shadow-lg text-sm"
          >
            + Add Client
          </button>
        )}
      </div>

      <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">
                <th className="px-6 md:px-10 py-4 md:py-6">Identity</th>
                <th className="px-6 md:px-10 py-4 md:py-6">Entity</th>
                <th className="px-6 md:px-10 py-4 md:py-6">Contact</th>
                {isAdmin && <th className="px-6 md:px-10 py-4 md:py-6 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 md:px-10 py-4 md:py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {client.name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{client.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">REF: {client.id.slice(-4)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 md:px-10 py-4 md:py-6">
                    <span className="text-sm font-bold text-slate-700 truncate block max-w-[150px]">{client.company}</span>
                  </td>
                  <td className="px-6 md:px-10 py-4 md:py-6">
                    <div className="text-xs font-bold text-slate-800 truncate max-w-[200px]">{client.email}</div>
                    <div className="text-[10px] text-slate-400 font-bold tracking-widest mt-1">{client.phone}</div>
                  </td>
                  {isAdmin && (
                    <td className="px-6 md:px-10 py-4 md:py-6 text-right">
                      <div className="flex justify-end gap-2 md:gap-3 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(client)} className="p-2 text-slate-400 hover:text-black transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                        <button onClick={() => handleDelete(client.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {clients.length === 0 && <div className="p-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">No Database Records</div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 z-50">
          <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl w-full max-w-lg p-8 md:p-12 animate-in fade-in zoom-in duration-300">
            <h3 className="text-xl md:text-2xl font-black mb-8">Registry Entry</h3>
            <form onSubmit={handleAddOrEdit} className="space-y-4 md:space-y-6">
              <div className="space-y-4">
                <input required placeholder="Client Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:bg-white focus:border-black font-bold transition-all text-sm" />
                <input required placeholder="Company Entity" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:bg-white focus:border-black font-bold transition-all text-sm" />
                <input required type="email" placeholder="Email Address" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:bg-white focus:border-black font-bold transition-all text-sm" />
                <input placeholder="Phone / Mobile" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:bg-white focus:border-black font-bold transition-all text-sm" />
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 md:gap-4 mt-8">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-black transition-colors order-2 sm:order-1">Discard</button>
                <button type="submit" className="px-8 py-3 text-sm font-bold text-white bg-black rounded-full shadow-lg hover:scale-105 transition-transform active:scale-95 order-1 sm:order-2">Save Records</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManager;
