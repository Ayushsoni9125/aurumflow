import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Hexagon, Lock } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login that redirects to admin
    localStorage.setItem('isAuthenticated', 'true');
    navigate('/admin');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md card p-8">
        <div className="flex justify-center mb-6">
          <Hexagon className="w-12 h-12 text-gold-500 fill-current" />
        </div>
        <h2 className="text-2xl font-display font-bold text-center text-forest-900 mb-6">Sign In to Admin</h2>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-forest-900 mb-1">Email Address</label>
            <input 
              type="email" 
              required
              className="input-field" 
              placeholder="admin@aurumflow.com" 
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
          <button type="submit" className="btn-primary w-full flex justify-center items-center gap-2">
            <Lock className="w-4 h-4" /> Sign In
          </button>
        </form>
        
        <p className="mt-4 text-center text-sm text-charcoal-800">
          Don't have an account? <Link to="/signup" className="text-gold-600 font-medium hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
