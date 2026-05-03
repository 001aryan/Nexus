import React, { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { UserProfile } from '@/types';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Camera, User, Mail, Shield, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!auth?.currentUser || !db) {
      setLoading(false);
      return;
    }
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'users', auth.currentUser!.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth?.currentUser || !db || !profile) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        displayName: profile.displayName,
      });
      toast.success('Core Identity Updated');
    } catch (e) {
      toast.error('Identification Sequence Failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Syncing Profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase">Security Profile</h1>
          <p className="text-[11px] text-slate-500 font-medium tracking-wide">Nexus Credentials & Interface Settings</p>
        </div>
        <div className="flex items-center gap-2">
           <Badge className="hd-badge hd-status-progress px-3">VERIFIED</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hd-card flex flex-col items-center p-8 bg-white relative">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center text-3xl font-bold text-white border-4 border-slate-50 shadow-xl overflow-hidden ring-1 ring-slate-100">
              {profile?.displayName?.[0] || 'U'}
            </div>
            <Button size="icon" className="absolute bottom-0 right-0 rounded-full h-7 w-7 bg-brand text-white border-2 border-white shadow-sm">
              <Camera size={12} />
            </Button>
          </div>
          <h2 className="mt-4 text-sm font-bold text-slate-900 uppercase tracking-wide">{profile?.displayName || 'Unknown User'}</h2>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-tighter uppercase">{profile?.email}</p>
          <div className="mt-4 pt-4 border-t border-slate-50 w-full flex flex-col gap-2">
             <div className="flex justify-between items-center px-2">
               <span className="text-[10px] font-bold text-slate-400 uppercase">Role</span>
               <Badge className="hd-badge hd-status-todo h-5">{profile?.role || 'Guest'}</Badge>
             </div>
             <div className="flex justify-between items-center px-2">
               <span className="text-[10px] font-bold text-slate-400 uppercase">Joined</span>
               <span className="text-[11px] font-medium text-slate-700">May 2026</span>
             </div>
          </div>
        </Card>

        <Card className="md:col-span-2 hd-card bg-white">
          <CardHeader className="py-4 px-6 border-b border-slate-50">
            <CardTitle className="text-xs font-bold uppercase tracking-widest">Personal Identification</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Display Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <input 
                    className="w-full pl-9 h-9 text-[12px] bg-slate-50/50 border border-slate-100 rounded-md focus:border-brand focus:ring-0 px-3 outline-none" 
                    value={profile?.displayName}
                    onChange={e => profile && setProfile({...profile, displayName: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Access</Label>
                <div className="relative opacity-60">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <input 
                    disabled
                    className="w-full pl-9 h-9 text-[12px] bg-slate-100 border border-slate-200 rounded-md px-3 cursor-not-allowed" 
                    value={profile?.email}
                  />
                </div>
                <p className="text-[10px] text-slate-400 italic font-medium">Identifier is locked to infrastructure account.</p>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <Button variant="ghost" className="h-9 text-[11px] font-bold text-slate-400 uppercase">Reset</Button>
                <Button type="submit" className="h-9 bg-brand px-6 text-[11px] font-bold" disabled={saving}>
                   <Save size={14} className="mr-2" />
                   {saving ? 'SYNCING...' : 'SAVE CORE ID'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="hd-card bg-[#1E293B] text-white p-6 border-none shadow-xl shadow-slate-200/40 overflow-hidden relative">
         <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-brand/10 rounded-full blur-3xl" />
         <div className="relative z-10 flex items-center gap-6">
            <div className="h-12 w-12 rounded-lg bg-brand/20 border border-brand/30 flex items-center justify-center">
               <Shield className="text-brand" size={24} />
            </div>
            <div className="flex-1">
               <h3 className="text-xs font-bold uppercase tracking-widest text-white">System Authorization</h3>
               <p className="text-[11px] text-slate-400 mt-1">Your account is currently under <span className="text-brand font-bold">Standard Deployment</span> protocol. Permission escalations require admin oversight.</p>
            </div>
            <Button variant="outline" className="h-8 border-brand/50 text-brand font-bold text-[10px] uppercase hover:bg-brand/10">
               Request Elevation
            </Button>
         </div>
      </Card>
    </div>
  );
}


