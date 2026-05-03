import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { useState, useEffect } from 'react';
import { auth, isInitialized } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

// Pages - to be created
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Projects from '@/pages/Projects';
import ProjectDetail from '@/pages/ProjectDetail';
import Profile from '@/pages/Profile';
import Team from '@/pages/Team';
import MainLayout from '@/components/MainLayout';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for mock user first (Demo mode)
    const mockUserJson = localStorage.getItem('nexus_mock_user');
    if (mockUserJson) {
      setUser(JSON.parse(mockUserJson) as User);
      setLoading(false);
      return;
    }

    // Poll for initialization if auth is missing
    const checkInitialization = setInterval(() => {
      if (isInitialized) {
        clearInterval(checkInitialization);
        
        if (auth) {
          const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setLoading(false);
          });
          return () => unsubscribe();
        } else {
          // If initialized but no auth, we are in "demo/demo" mode or config failed
          setLoading(false);
        }
      }
    }, 100);

    return () => clearInterval(checkInitialization);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground antialiased font-sans">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 bg-brand rounded flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 mb-6 animate-pulse">
            N
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] animate-pulse">Initializing Nexus</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
        
        <Route element={<MainLayout user={user} />}>
          <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/projects" element={user ? <Projects /> : <Navigate to="/login" />} />
          <Route path="/projects/:id" element={user ? <ProjectDetail /> : <Navigate to="/login" />} />
          <Route path="/team" element={user ? <Team /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
