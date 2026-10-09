import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Hexagon, UserPlus, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { registerUser } from '../api';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const signupMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('userId', data.id);
      navigate('/apply');
    },
    onError: (err: any) => {
      const apiError = err.response?.data?.error;
      if (apiError?.fields?.length > 0) {
        const field = apiError.fields[0];
        const fieldName = String(field.path[0]).charAt(0).toUpperCase() + String(field.path[0]).slice(1);
        setError(`${fieldName}: ${field.message}`);
      } else {
        setError(apiError?.message || 'Failed to create account');
      }
    }
  });

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    signupMutation.mutate({ name, email, password });
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md card p-8">
        <div className="flex justify-center mb-6">
          <Hexagon className="w-12 h-12 text-gold-500 fill-current" />
        </div>
        <h2 className="text-2xl font-display font-bold text-center text-forest-900 mb-6">Create Account</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-forest-900 mb-1">Full Name</label>
            <input 
              type="text" 
              required
              minLength={2}
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
              minLength={6}
              className="input-field" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" disabled={signupMutation.isPending} className="btn-primary w-full flex justify-center items-center gap-2">
            {signupMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Sign Up
          </button>
        </form>
        
        <p className="mt-4 text-center text-sm text-charcoal-800">
          Already have an account? <Link to="/login" className="text-gold-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
