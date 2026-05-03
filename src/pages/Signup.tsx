import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'motion/react';
import { Mail, Lock, UserPlus, User } from 'lucide-react';
import { toast } from 'sonner';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) {
      toast.error('Nexus is in offline/demo mode. Database connection unavailable.');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName });

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName,
        role: 'member',
        createdAt: Date.now(),
      });

      toast.success('Account provisioned successfully!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Account initialization failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans antialiased">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[380px]"
      >
        <div className="flex flex-col items-center mb-10">
           <div className="w-10 h-10 bg-brand rounded flex items-center justify-center text-white text-lg font-bold shadow-xl shadow-blue-500/20 mb-6 -rotate-3">
             N
           </div>
           <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase text-center">Initialize Nexus Account</h1>
           <p className="text-slate-400 text-[11px] font-medium mt-1 uppercase tracking-widest">Workspace Registration</p>
        </div>

        <Card className="hd-card shadow-xl shadow-slate-200/40 p-1">
          <CardHeader className="pb-4 pt-6 px-6">
            <CardTitle className="text-sm font-bold uppercase tracking-wide">Infrastructure Setup</CardTitle>
            <CardDescription className="text-[11px]">
              Provision your personal developer profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="displayName" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Identity</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <input 
                    id="displayName" 
                    placeholder="Full Name" 
                    className="w-full pl-9 h-9 text-[12px] bg-slate-50/50 border border-slate-100 rounded-md focus:border-brand focus:ring-0 px-3 outline-none" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Work Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <input 
                    id="email" 
                    type="email" 
                    placeholder="user@nexus-core.io" 
                    className="w-full pl-9 h-9 text-[12px] bg-slate-50/50 border border-slate-100 rounded-md focus:border-brand focus:ring-0 px-3 outline-none" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Access Token</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <input 
                    id="password" 
                    type="password" 
                    placeholder="Security Credential"
                    className="w-full pl-9 h-9 text-[12px] bg-slate-50/50 border border-slate-100 rounded-md focus:border-brand focus:ring-0 px-3 outline-none" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-brand hover:bg-blue-600 h-10 text-[12px] font-bold shadow-lg shadow-blue-500/10" disabled={loading}>
                {loading ? 'PROVISIONING...' : (
                  <>
                    <UserPlus className="mr-2" size={14} /> INITIALIZE ACCOUNT
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 border-t border-slate-50 py-4 px-6 bg-slate-50/30">
            <div className="text-[11px] text-center text-slate-400 font-medium tracking-wide">
              ALREADY REGISTERED?{' '}
              <Link to="/login" className="text-brand font-bold hover:underline ml-1">
                ACCESS TERMINAL
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
