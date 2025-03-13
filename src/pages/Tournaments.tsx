import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, Calendar, MapPin, Users, DollarSign, 
  MoreVertical, Edit, Copy, UserPlus, X, Trash2, Settings 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Tournament {
  id: string;
  name: string;
  date: string;
  location: string;
  max_players: number;
  entry_fee: number;
  status: 'upcoming' | 'in_progress' | 'completed';
  created_at: string;
  organizer_id: string;
  pre_registration: boolean;
}

interface TournamentFormData {
  name: string;
  date: string;
  location: string;
  max_players: string;
  entry_fee: string;
  pre_registration: boolean;
}

export default function Tournaments() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isCheckInMode, setIsCheckInMode] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [formData, setFormData] = useState<TournamentFormData>({
    name: '',
    date: '',
    location: '',
    max_players: '2',
    entry_fee: '0',
    pre_registration: false
  });

  useEffect(() => {
    loadTournaments();
    // Close menu when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.tournament-menu')) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedTournament && isEditMode) {
      setFormData({
        name: selectedTournament.name,
        date: selectedTournament.date,
        location: selectedTournament.location,
        max_players: String(selectedTournament.max_players),
        entry_fee: String(selectedTournament.entry_fee),
        pre_registration: selectedTournament.pre_registration
      });
    }
  }, [selectedTournament, isEditMode]);

  const loadTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;

      setTournaments(data || []);
    } catch (error) {
      console.error('Error loading tournaments:', error);
      toast.error('Failed to load tournaments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournament) return;

    try {
      const { error } = await supabase
        .from('tournaments')
        .update({
          name: formData.name,
          date: formData.date,
          location: formData.location,
          max_players: parseInt(formData.max_players) || 2,
          entry_fee: parseFloat(formData.entry_fee) || 0,
          pre_registration: formData.pre_registration,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTournament.id);

      if (error) throw error;

      toast.success('Tournament updated successfully!');
      await loadTournaments();
      setIsEditMode(false);
      setSelectedTournament(null);
    } catch (error) {
      toast.error('Failed to update tournament');
    }
  };

  const handleCloneTournament = async (tournament: Tournament) => {
    try {
      const { error } = await supabase
        .from('tournaments')
        .insert([{
          name: `${tournament.name} (Copy)`,
          date: tournament.date,
          location: tournament.location,
          max_players: tournament.max_players,
          entry_fee: tournament.entry_fee,
          pre_registration: tournament.pre_registration,
          organizer_id: user?.id,
          status: 'upcoming'
        }]);

      if (error) throw error;

      toast.success('Tournament cloned successfully!');
      await loadTournaments();
      setActiveMenu(null);
    } catch (error) {
      toast.error('Failed to clone tournament');
    }
  };

  const handleDeleteTournament = async () => {
    if (!selectedTournament) return;

    try {
      const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', selectedTournament.id);

      if (error) throw error;

      toast.success('Tournament deleted successfully!');
      await loadTournaments();
      setIsDeleteMode(false);
      setSelectedTournament(null);
    } catch (error) {
      toast.error('Failed to delete tournament');
    }
  };

  const closeModal = () => {
    setSelectedTournament(null);
    setIsEditMode(false);
    setIsCheckInMode(false);
    setIsDeleteMode(false);
    setFormData({
      name: '',
      date: '',
      location: '',
      max_players: '2',
      entry_fee: '0',
      pre_registration: false
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-800 p-6 rounded-lg">
              <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tournaments.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">No Tournaments Found</h2>
        <p className="text-gray-400 mb-6">There are no tournaments scheduled at the moment.</p>
        {user && (
          <Link
            to="/organize"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition duration-150"
          >
            Create Tournament
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Tournaments</h2>
        {user && (
          <Link
            to="/organize"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition duration-150"
          >
            Create Tournament
          </Link>
        )}
      </div>
      
      <div className="grid gap-4">
        {tournaments.map((tournament) => (
          <div
            key={tournament.id}
            className="bg-gray-800 p-6 rounded-lg shadow-lg"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold">{tournament.name}</h3>
              <div className="flex items-center gap-2">
                {tournament.pre_registration && (
                  <span className="px-3 py-1 rounded-full text-sm bg-blue-600">
                    Pre-Registration
                  </span>
                )}
                <span className={`px-3 py-1 rounded-full text-sm ${
                  tournament.status === 'upcoming' ? 'bg-green-600' :
                  tournament.status === 'in_progress' ? 'bg-yellow-600' :
                  'bg-gray-600'
                }`}>
                  {tournament.status.replace('_', ' ')}
                </span>
                <div className="relative tournament-menu">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenu(activeMenu === tournament.id ? null : tournament.id);
                    }}
                    className="p-2 hover:bg-gray-700 rounded-full transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  
                  {activeMenu === tournament.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg py-1 z-10">
                      {user && user.id === tournament.organizer_id && (
                        <>
                          <Link
                            to={`/tournament/${tournament.id}/admin`}
                            className="w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center"
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Tournament Admin
                          </Link>
                          <button
                            onClick={() => {
                              setSelectedTournament(tournament);
                              setIsEditMode(true);
                              setActiveMenu(null);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Tournament
                          </button>
                          <button
                            onClick={() => {
                              handleCloneTournament(tournament);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Clone Tournament
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTournament(tournament);
                              setIsDeleteMode(true);
                              setActiveMenu(null);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center text-red-400"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Tournament
                          </button>
                          <div className="border-t border-gray-700 my-1"></div>
                        </>
                      )}
                      <button
                        onClick={() => {
                          setSelectedTournament(tournament);
                          setIsCheckInMode(true);
                          setActiveMenu(null);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        {tournament.pre_registration ? 'Register' : 'Check In'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center text-gray-400">
                <Calendar className="w-5 h-5 mr-2" />
                <span>{new Date(tournament.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center text-gray-400">
                <MapPin className="w-5 h-5 mr-2" />
                <span>{tournament.location}</span>
              </div>
              <div className="flex items-center text-gray-400">
                <Users className="w-5 h-5 mr-2" />
                <span>Max Players: {tournament.max_players}</span>
              </div>
              <div className="flex items-center text-gray-400">
                <DollarSign className="w-5 h-5 mr-2" />
                <span>Entry Fee: ${tournament.entry_fee}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {selectedTournament && isEditMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Edit Tournament</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tournament Name</label>
                <input
                  type="text"
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Maximum Players</label>
                <input
                  type="number"
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500"
                  value={formData.max_players}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_players: e.target.value }))}
                  min="2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Entry Fee ($)</label>
                <input
                  type="number"
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500"
                  value={formData.entry_fee}
                  onChange={(e) => setFormData(prev => ({ ...prev, entry_fee: e.target.value }))}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="editPreRegistration"
                  className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                  checked={formData.pre_registration}
                  onChange={(e) => setFormData(prev => ({ ...prev, pre_registration: e.target.checked }))}
                />
                <label htmlFor="editPreRegistration" className="text-sm font-medium">
                  Enable Pre-Registration
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Check In Modal */}
      {selectedTournament && isCheckInMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {selectedTournament.pre_registration ? 'Tournament Registration' : 'Player Check-In'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-400">
                {selectedTournament.pre_registration
                  ? 'Registration functionality will be implemented in the next update.'
                  : 'Check-in functionality will be implemented in the next update.'}
              </p>
              <button
                onClick={closeModal}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {selectedTournament && isDeleteMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Delete Tournament</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-400">
                Are you sure you want to delete "{selectedTournament.name}"? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={closeModal}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTournament}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded"
                >
                  Delete Tournament
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}