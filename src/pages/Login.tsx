import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'motion/react';
import { Mail, Lock, LogIn, Chrome } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Demo account bypass logic
    if (password === 'nexus2026' && (email === 'admin@nexus-core.io' || email === 'staff@nexus-core.io')) {
      const mockUser = {
        uid: email === 'admin@nexus-core.io' ? 'demo-admin' : 'demo-staff',
        email: email,
        displayName: email === 'admin@nexus-core.io' ? 'System Administrator' : 'Staff Member',
        role: email === 'admin@nexus-core.io' ? 'admin' : 'staff',
      };
      localStorage.setItem('nexus_mock_user', JSON.stringify(mockUser));
      toast.success(`Access Granted: ${mockUser.displayName}`);
      window.location.href = '/';
      return;
    }

    if (!auth) {
      toast.error('Nexus is in offline/demo mode. Use demo credentials or check configuration.');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Welcome back to Nexus!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Authentication sequence failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth) {
      toast.error('Nexus is in offline/demo mode. Google Auth unavailable.');
      return;
    }
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success('SSO Authentication Successful');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Google authentication sequence failed');
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
           <div className="w-10 h-10 bg-brand rounded flex items-center justify-center text-white text-lg font-bold shadow-xl shadow-blue-500/20 mb-6">
             N
           </div>
           <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase">Login to Nexus Core</h1>
           <p className="text-slate-400 text-[11px] font-medium mt-1 uppercase tracking-widest">Authorized Personnel Only</p>
        </div>

        <Card className="hd-card shadow-xl shadow-slate-200/40 p-1">
          <CardHeader className="pb-4 pt-6 px-6">
            <CardTitle className="text-sm font-bold uppercase tracking-wide">Workspace Login</CardTitle>
            <CardDescription className="text-[11px]">
              Access your project management terminal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="user@nexus-core.io" 
                    className="pl-9 h-9 text-[12px] bg-slate-50/50 border-slate-100 focus:border-brand focus:ring-0" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Security Token</Label>
                  <a href="#" className="text-[10px] text-brand font-bold uppercase hover:underline">Reset</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••"
                    className="pl-9 h-9 text-[12px] bg-slate-50/50 border-slate-100 focus:border-brand focus:ring-0" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-brand hover:bg-blue-600 h-10 text-[12px] font-bold shadow-lg shadow-blue-500/10" disabled={loading}>
                {loading ? 'AUTHENTICATING...' : (
                  <>
                    <LogIn className="mr-2" size={14} /> ACCESS TERMINAL
                  </>
                )}
              </Button>
            </form>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-[9px] uppercase font-bold tracking-widest">
                <span className="bg-white px-3 text-slate-300">Third-Party SSO</span>
              </div>
            </div>

            <Button variant="outline" className="w-full h-9 border-slate-100 text-slate-600 font-bold text-[11px] hover:bg-slate-50" onClick={handleGoogleLogin}>
              <Chrome className="mr-2" size={14} /> SIGN IN WITH GOOGLE
            </Button>

            <div className="pt-6 space-y-3">
              <div className="flex justify-center">
                <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Demo Terminals</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  className="h-8 text-[9px] font-bold border-brand/20 bg-brand/5 text-brand hover:bg-brand/10"
                  onClick={() => {
                    setEmail('admin@nexus-core.io');
                    setPassword('nexus2026');
                  }}
                >
                  ADMIN ACCOUNT
                </Button>
                <Button 
                  variant="outline" 
                  className="h-8 text-[9px] font-bold border-slate-200 text-slate-500 hover:bg-slate-50"
                  onClick={() => {
                    setEmail('staff@nexus-core.io');
                    setPassword('nexus2026');
                  }}
                >
                  EMPLOYEE ACCOUNT
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 border-t border-slate-50 py-4 px-6 bg-slate-50/30">
            <div className="text-[11px] text-center text-slate-400 font-medium tracking-wide">
              NEW TO NEXUS?{' '}
              <Link to="/signup" className="text-brand font-bold hover:underline ml-1">
                INITIALIZE ACCOUNT
              </Link>
            </div>
          </CardFooter>
        </Card>
        
        <p className="mt-8 text-center text-[10px] text-slate-400 font-medium uppercase tracking-[0.2em]">
          &copy; 2026 Nexus Infrastructure Group
        </p>
      </motion.div>
    </div>
  );
}
