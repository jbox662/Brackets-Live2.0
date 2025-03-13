import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { UserCircle2, ChevronRight } from 'lucide-react';

interface PlayerProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

type Tab = 'PROFILE' | 'RANKINGS' | 'PRACTICE';

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('PROFILE');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: user?.email || '',
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('player_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
        setFormData({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (profile) {
        // Update existing profile
        const { error } = await supabase
          .from('player_profiles')
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id);

        if (error) throw error;
        toast.success('Profile updated successfully!');
      } else {
        // Create new profile
        const { error } = await supabase
          .from('player_profiles')
          .insert([
            {
              user_id: user?.id,
              first_name: formData.first_name,
              last_name: formData.last_name,
              email: formData.email,
            },
          ]);

        if (error) throw error;
        toast.success('Profile created successfully!');
      }

      await loadProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-gray-800 rounded-lg shadow-lg">
        <div className="flex items-center justify-between p-4 bg-gray-900">
          <button onClick={() => navigate(-1)} className="text-white">
            <ChevronRight className="w-6 h-6 transform rotate-180" />
          </button>
          <div className="flex space-x-4">
            {(['PROFILE', 'RANKINGS', 'PRACTICE'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 text-sm ${
                  activeTab === tab ? 'text-red-500 font-semibold' : 'text-gray-400'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="w-6" /> {/* Spacer */}
        </div>

        <div className="flex justify-center p-8">
          <div className="flex flex-col items-center">
            <UserCircle2 className="w-24 h-24 text-gray-400 mb-2" />
            <span className="text-xl font-semibold">
              {profile ? `${profile.first_name} ${profile.last_name}` : 'Guest'}
            </span>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                required
                className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                disabled={isSaving}
                placeholder="First Name"
              />
            </div>
            
            <div>
              <input
                type="text"
                required
                className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                disabled={isSaving}
                placeholder="Last Name"
              />
            </div>

            <div>
              <input
                type="email"
                required
                className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                disabled={isSaving}
                placeholder="Email"
              />
              <p className="mt-2 text-sm text-center text-gray-400">
                Entering your email allows us to rate your play and you can track results
              </p>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className={`w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg transition duration-150 ${
                isSaving ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSaving ? 'Saving...' : profile ? 'Update Profile' : 'Create Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}