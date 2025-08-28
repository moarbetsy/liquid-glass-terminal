import React, { useState } from 'react';
import { GlassCard } from './common';

const Label = ({ children, htmlFor }: { children: React.ReactNode, htmlFor: string }) => <label htmlFor={htmlFor} className="text-sm font-medium text-muted">{children}</label>;
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />;

// The SHA-256 hash of 'admin'
const ADMIN_PASSWORD_HASH = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918';

const USERS: Record<string, string> = {
  'admin': ADMIN_PASSWORD_HASH,
};

interface LoginPageProps {
  onLoginSuccess: (username: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const hashPassword = async (pass: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pass);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    try {
      const hashedPassword = await hashPassword(password);
      
      if (USERS[username] && USERS[username] === hashedPassword) {
        onLoginSuccess(username);
      } else {
        setError('Invalid username or password.');
        setPassword('');
      }
    } catch (err) {
      console.error("Login error:", err);
      if (typeof crypto.subtle === 'undefined') {
        setError('Error: This feature requires a secure connection (HTTPS).');
      } else {
        setError('An unexpected error occurred during login.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <div className="w-full max-w-sm">
        <GlassCard title="Liquid Glass - Login">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            {error && <p className="text-sm text-red-400 text-center">{error}</p>}
            <div className="pt-2">
              <button type="submit" className="w-full gloss-btn">
                Log In
              </button>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
};

export default LoginPage;