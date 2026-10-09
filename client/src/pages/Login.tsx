import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Hexagon, Lock, Info } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock login and assign roles
    localStorage.setItem('isAuthenticated', 'true');
    if (email === 'admin@aurumflow.com') {
      localStorage.setItem('userRole', 'admin');
      navigate('/admin');
    } else {
      localStorage.setItem('userRole', 'user');
      navigate('/apply');
    }
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
