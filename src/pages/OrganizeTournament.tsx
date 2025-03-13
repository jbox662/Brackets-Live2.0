import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface TournamentFormData {
  tournamentName: string;
  date: string;
  location: string;
  maxPlayers: string;
  entryFee: string;
  preRegistration: boolean;
}

export default function OrganizeTournament() {
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
  });
  const [tournamentForm, setTournamentForm] = useState<TournamentFormData>({
    tournamentName: '',
    date: '',
    location: '',
    maxPlayers: '',
    entryFee: '',
    preRegistration: false
  });

  const validateForm = () => {
    if (!authForm.email.trim()) {
      throw new Error('Email is required');
    }
    if (!authForm.email.includes('@')) {
      throw new Error('Please enter a valid email address');
    }
    if (!authForm.password) {
      throw new Error('Password is required');
    }
    if (authForm.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    try {
      validateForm();

      if (isLoginMode) {
        await signIn(authForm.email, authForm.password);
        toast.success('Logged in successfully!');
      } else {
        await signUp(authForm.email, authForm.password);
        toast.success('Account created successfully! You can now log in.');
        setIsLoginMode(true);
        setAuthForm(prev => ({ ...prev, password: '' }));
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTournamentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('tournaments')
        .insert([
          {
            name: tournamentForm.tournamentName,
            date: tournamentForm.date,
            location: tournamentForm.location,
            max_players: parseInt(tournamentForm.maxPlayers),
            entry_fee: parseFloat(tournamentForm.entryFee),
            organizer_id: user?.id,
            status: 'upcoming',
            pre_registration: tournamentForm.preRegistration
          }
        ]);

      if (error) throw error;

      toast.success('Tournament created successfully!');
      navigate('/tournaments');
    } catch (error) {
      console.error('Tournament creation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create tournament');
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-6">Create Tournament</h2>
          <form onSubmit={handleTournamentSubmit} className="space-y-4">
            <div>
              <label htmlFor="tournamentName" className="block text-sm font-medium mb-1">
                Tournament Name
              </label>
              <input
                type="text"
                id="tournamentName"
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Enter tournament name"
                value={tournamentForm.tournamentName}
                onChange={(e) => setTournamentForm(prev => ({ ...prev, tournamentName: e.target.value }))}
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="date" className="block text-sm font-medium mb-1">
                Date
              </label>
              <input
                type="date"
                id="date"
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={tournamentForm.date}
                onChange={(e) => setTournamentForm(prev => ({ ...prev, date: e.target.value }))}
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium mb-1">
                Location
              </label>
              <input
                type="text"
                id="location"
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Enter tournament location"
                value={tournamentForm.location}
                onChange={(e) => setTournamentForm(prev => ({ ...prev, location: e.target.value }))}
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="maxPlayers" className="block text-sm font-medium mb-1">
                Maximum Players
              </label>
              <input
                type="number"
                id="maxPlayers"
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Enter maximum number of players"
                min="2"
                value={tournamentForm.maxPlayers}
                onChange={(e) => setTournamentForm(prev => ({ ...prev, maxPlayers: e.target.value }))}
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="entryFee" className="block text-sm font-medium mb-1">
                Entry Fee ($)
              </label>
              <input
                type="number"
                id="entryFee"
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Enter entry fee"
                min="0"
                step="0.01"
                value={tournamentForm.entryFee}
                onChange={(e) => setTournamentForm(prev => ({ ...prev, entryFee: e.target.value }))}
                required
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="preRegistration"
                className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                checked={tournamentForm.preRegistration}
                onChange={(e) => setTournamentForm(prev => ({ ...prev, preRegistration: e.target.checked }))}
                disabled={isLoading}
              />
              <label htmlFor="preRegistration" className="text-sm font-medium">
                Enable Pre-Registration
              </label>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition duration-150 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Creating...' : 'Create Tournament'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isLoginMode ? 'Login to Organize Tournament' : 'Create an Account'}
        </h2>
        <form onSubmit={handleAuthSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={authForm.email}
              onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value.trim() }))}
              disabled={isLoading}
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={authForm.password}
              onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
              disabled={isLoading}
              placeholder="Enter your password"
              minLength={6}
              required
            />
            <p className="mt-1 text-sm text-gray-400">
              {isLoginMode 
                ? "Enter your password to log in"
                : "Password must be at least 6 characters long"}
            </p>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition duration-150 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading
              ? 'Please wait...'
              : isLoginMode
              ? 'Login'
              : 'Create Account'}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setAuthForm(prev => ({ ...prev, password: '' }));
            }}
            className="text-blue-400 hover:text-blue-300 text-sm"
            disabled={isLoading}
          >
            {isLoginMode
              ? "Don't have an account? Sign up"
              : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
}