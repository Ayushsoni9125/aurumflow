import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Hexagon, Lock, Info, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { loginUser } from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userRole', data.role);
      navigate(data.role === 'admin' ? '/admin' : '/apply');
    },
    onError: (err: any) => {
      setError(err.response?.data?.error?.message || 'Invalid email or password');
    }
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Hardcoded demo check for quick access without DB setup for reviewers
    if (email === 'admin@aurumflow.com' && password === 'admin') {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userRole', 'admin');
      navigate('/admin');
      return;
    } 
    if (email === 'user@aurumflow.com' && password === 'user') {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userRole', 'user');
      navigate('/apply');
      return;
    }

    loginMutation.mutate({ email, password });
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md card p-8">
        <div className="flex justify-center mb-6">
          <Hexagon className="w-12 h-12 text-gold-500 fill-current" />
        </div>
        <h2 className="text-2xl font-display font-bold text-center text-forest-900 mb-6">Sign In</h2>
        
        {/* Demo Credentials Info */}
        <div className="bg-ivory-100 border border-ivory-200 rounded-lg p-4 mb-6 text-sm text-charcoal-800">
          <div className="flex items-center gap-2 font-semibold text-forest-900 mb-2">
            <Info className="w-4 h-4" />
            Demo Credentials (Click to fill)
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Admin:</span>
              <button 
                type="button"
                onClick={() => {
                  setEmail('admin@aurumflow.com');
                  setPassword('admin');
                }}
                className="font-mono text-xs bg-white hover:bg-gold-50 border border-ivory-200 px-2 py-1 rounded cursor-pointer transition-colors active:scale-95"
              >
                admin@aurumflow.com / admin
              </button>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">User:</span>
              <button 
                type="button"
                onClick={() => {
                  setEmail('user@aurumflow.com');
                  setPassword('user');
                }}
                className="font-mono text-xs bg-white hover:bg-gold-50 border border-ivory-200 px-2 py-1 rounded cursor-pointer transition-colors active:scale-95"
              >
                user@aurumflow.com / user
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-forest-900 mb-1">Email Address</label>
            <input 
              type="email" 
              required
              className="input-field" 
              placeholder="user@aurumflow.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-forest-900 mb-1">Password</label>
            <input 
              type="password" 
              required
              className="input-field" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" disabled={loginMutation.isPending} className="btn-primary w-full flex justify-center items-center gap-2">
            {loginMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} Sign In
          </button>
        </form>
        
        <p className="mt-4 text-center text-sm text-charcoal-800">
          Don't have an account? <Link to="/signup" className="text-gold-600 font-medium hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
