import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Hexagon, UserPlus } from 'lucide-react';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock signup that redirects to admin
    localStorage.setItem('isAuthenticated', 'true');
    navigate('/admin');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md card p-8">
        <div className="flex justify-center mb-6">
          <Hexagon className="w-12 h-12 text-gold-500 fill-current" />
        </div>
        <h2 className="text-2xl font-display font-bold text-center text-forest-900 mb-6">Create Admin Account</h2>
        
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-forest-900 mb-1">Full Name</label>
            <input 
              type="text" 
              required
              className="input-field" 
              placeholder="John Doe" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
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
            <UserPlus className="w-4 h-4" /> Sign Up
          </button>
        </form>
        
        <p className="mt-4 text-center text-sm text-charcoal-800">
          Already have an account? <Link to="/login" className="text-gold-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
