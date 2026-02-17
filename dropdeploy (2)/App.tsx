import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebaseConfig';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import Deploy from './pages/Deploy';
import SiteOverview from './pages/SiteOverview';
import Preview from './pages/Preview';
import Layout from './components/Layout';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        
        <Route path="/" element={user ? <Layout user={user} /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard user={user!} />} />
          <Route path="deploy" element={<Deploy user={user!} />} />
          <Route path="site/:siteId" element={<SiteOverview />} />
        </Route>
        
        {/* Preview Route acts independently to simulate a hosted site */}
        <Route path="/preview/:siteId/*" element={<Preview />} />
      </Routes>
    </HashRouter>
  );
};

export default App;