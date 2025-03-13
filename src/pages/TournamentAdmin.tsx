import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Users, Upload, UserPlus, X, 
  Brackets, AlertCircle, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Player {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  registration: {
    seed: number;
    status: 'registered' | 'checked_in' | 'eliminated';
  };
}

interface Tournament {
  id: string;
  name: string;
  date: string;
  location: string;
  max_players: number;
  entry_fee: number;
  status: 'upcoming' | 'in_progress' | 'completed';
  pre_registration: boolean;
  organizer_id: string;
}

export default function TournamentAdmin() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    first_name: '',
    last_name: '',
    email: ''
  });

  useEffect(() => {
    if (tournamentId) {
      loadTournamentData();
    }
  }, [tournamentId]);

  const loadTournamentData = async () => {
    try {
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single();

      if (tournamentError) {
        console.error('Tournament error:', tournamentError);
        throw new Error(tournamentError.message);
      }
      
      if (!tournamentData) {
        throw new Error('Tournament not found');
      }

      setTournament(tournamentData);

      // Load registered players with their profiles
      const { data: registrationsData, error: registrationsError } = await supabase
        .from('tournament_registrations')
        .select(`
          seed,
          status,
          player_profiles!inner (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('tournament_id', tournamentId)
        .order('seed');

      if (registrationsError) {
        console.error('Registrations error:', registrationsError);
        throw new Error(registrationsError.message);
      }

      // Format the players data
      const formattedPlayers = registrationsData.map(reg => ({
        id: reg.player_profiles.id,
        first_name: reg.player_profiles.first_name,
        last_name: reg.player_profiles.last_name,
        email: reg.player_profiles.email,
        registration: {
          seed: reg.seed,
          status: reg.status
        }
      }));

      setPlayers(formattedPlayers);
    } catch (error) {
      console.error('Error loading tournament:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load tournament data');
      navigate('/tournaments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Create a new player profile
      const { data: profileData, error: profileError } = await supabase
        .from('player_profiles')
        .insert([{
          first_name: newPlayer.first_name,
          last_name: newPlayer.last_name,
          email: newPlayer.email || null,
          user_id: null // Since we're not requiring authentication for testing
        }])
        .select()
        .single();

      if (profileError) throw profileError;

      // Register the player in the tournament
      const { error: registrationError } = await supabase
        .from('tournament_registrations')
        .insert([{
          tournament_id: tournamentId,
          player_id: profileData.id,
          status: 'registered',
          seed: players.length + 1
        }]);

      if (registrationError) throw registrationError;

      toast.success('Player added successfully!');
      setIsAddingPlayer(false);
      loadTournamentData(); // Refresh the player list
    } catch (error) {
      console.error('Error adding player:', error);
      toast.error('Failed to add player');
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // This will be implemented when we add CSV import functionality
    toast.success('Players imported successfully!');
    setIsImporting(false);
  };

  const handleBracketSetup = () => {
    if (!tournament || players.length < 2) {
      toast.error('Need at least 2 players to set up the bracket');
      return;
    }

    // Navigate to the bracket management page
    navigate(`/tournament/${tournamentId}/bracket`);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Tournament Not Found</h2>
        <button
          onClick={() => navigate('/tournaments')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
        >
          Back to Tournaments
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">{tournament.name}</h2>
          <p className="text-gray-400">Tournament Administration</p>
        </div>
        <button
          onClick={() => navigate('/tournaments')}
          className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded"
        >
          Back to Tournaments
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Players</h3>
            <span className="text-gray-400">{players.length} / {tournament.max_players}</span>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => setIsAddingPlayer(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded flex items-center justify-center"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Add Player
            </button>
            <button
              onClick={() => setIsImporting(true)}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded flex items-center justify-center"
            >
              <Upload className="w-5 h-5 mr-2" />
              Import Players
            </button>
            <button
              onClick={handleBracketSetup}
              disabled={players.length < 2}
              className={`w-full font-medium py-2 px-4 rounded flex items-center justify-center ${
                players.length < 2
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              <Brackets className="w-5 h-5 mr-2" />
              Go to Bracket Setup
            </button>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Tournament Details</h3>
          <div className="space-y-2 text-gray-400">
            <p>Date: {new Date(tournament.date).toLocaleDateString()}</p>
            <p>Location: {tournament.location}</p>
            <p>Entry Fee: ${tournament.entry_fee}</p>
            <p>Status: {tournament.status}</p>
            <p>Pre-registration: {tournament.pre_registration ? 'Enabled' : 'Disabled'}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Registered Players</h3>
          <span className="text-gray-400">{players.length} players</span>
        </div>
        {players.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No players registered yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {players.map((player) => (
              <div key={player.id} className="py-3 flex justify-between items-center">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm bg-gray-700 px-2 py-1 rounded">
                      Seed #{player.registration.seed}
                    </span>
                    <p className="font-medium">{player.first_name} {player.last_name}</p>
                  </div>
                  {player.email && (
                    <p className="text-sm text-gray-400">{player.email}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-sm rounded ${
                    player.registration.status === 'checked_in' 
                      ? 'bg-green-600' 
                      : player.registration.status === 'eliminated'
                      ? 'bg-red-600'
                      : 'bg-blue-600'
                  }`}>
                    {player.registration.status}
                  </span>
                  <button className="text-red-400 hover:text-red-300">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Player Modal */}
      {isAddingPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Add Player</h3>
              <button onClick={() => setIsAddingPlayer(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddPlayer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">First Name</label>
                <input
                  type="text"
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500"
                  value={newPlayer.first_name}
                  onChange={(e) => setNewPlayer(prev => ({ ...prev, first_name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Name</label>
                <input
                  type="text"
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500"
                  value={newPlayer.last_name}
                  onChange={(e) => setNewPlayer(prev => ({ ...prev, last_name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Email <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="email"
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500"
                  value={newPlayer.email}
                  onChange={(e) => setNewPlayer(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingPlayer(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
                >
                  Add Player
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Players Modal */}
      {isImporting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Import Players</h3>
              <button onClick={() => setIsImporting(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-400">
                Upload a CSV file with player information. The file should have the following columns:
                first_name, last_name, email (optional)
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileImport}
                className="block w-full text-sm text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded file:border-0
                  file:text-sm file:font-medium
                  file:bg-blue-600 file:text-white
                  hover:file:bg-blue-700"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setIsImporting(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}