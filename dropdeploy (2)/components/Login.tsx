import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebaseConfig';
import { Hexagon, ArrowRight, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/configuration-not-found' || err.code === 'auth/api-key-not-valid') {
        setError("Firebase configuration is missing or invalid. Please check firebaseConfig.ts");
      } else {
        setError("Failed to sign in. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="z-10 bg-slate-800/50 backdrop-blur-xl border border-slate-700 p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
            <Hexagon className="w-8 h-8 text-white fill-current" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-center text-white mb-2">DropDeploy</h1>
        <p className="text-slate-400 text-center mb-8">
          The easiest way to deploy static sites. Just drag, drop, and go live.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <button
          onClick={handleLogin}
          className="w-full bg-white text-slate-900 hover:bg-slate-100 font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 group"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          <span>Continue with Google</span>
          <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all" />
        </button>

        <p className="mt-6 text-xs text-center text-slate-500">
          By clicking continue, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default Login;