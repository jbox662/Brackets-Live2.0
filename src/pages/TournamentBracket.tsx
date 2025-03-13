import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft,
  Users, 
  Upload, 
  UserPlus, 
  X, 
  Brackets, 
  AlertCircle, 
  Trash2,
  Save,
  Settings,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import BracketDisplay from '../components/BracketDisplay';

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

interface Bracket {
  id: string;
  bracket_type: 'single' | 'split';
  format: string;
  seeding: string;
  tables_per_bracket: number;
  weighted_matchups: boolean;
  bracket_size: number;
  uppers_race_to: number;
  lowers_race_to: number;
  championship_format: string;
  best_of: 'Disabled' | '3' | '5' | '7';
  status: 'draft' | 'active' | 'completed';
}

interface Match {
  id: string;
  bracket_id: string;
  round: number;
  match_number: number;
  player1_id: string | null;
  player2_id: string | null;
  player1_score: number;
  player2_score: number;
  winner_id: string | null;
  table_number: number;
  status: 'pending' | 'in_progress' | 'completed';
}

interface BracketConfig {
  bracketType: 'single' | 'split';
  format: string;
  seeding: string;
  tablesPerBracket: string;
  weightedMatchups: boolean;
  bracketSize: string;
  uppersRaceTo: string;
  lowersRaceTo: string;
  championshipFormat: string;
  bestOf: 'Disabled' | '3' | '5' | '7';
}

export default function TournamentBracket() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [bracket, setBracket] = useState<Bracket | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bracketConfig, setBracketConfig] = useState<BracketConfig>({
    bracketType: 'single',
    format: 'Single Elimination',
    seeding: 'Standard',
    tablesPerBracket: '2',
    weightedMatchups: false,
    bracketSize: '0',
    uppersRaceTo: '3',
    lowersRaceTo: '3',
    championshipFormat: 'Single Game',
    bestOf: 'Disabled'
  });

  useEffect(() => {
    if (tournamentId) {
      loadTournamentData();
    }
  }, [tournamentId]);

  const loadTournamentData = async () => {
    try {
      // Load tournament details
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single();

      if (tournamentError) throw tournamentError;
      if (!tournamentData) throw new Error('Tournament not found');

      setTournament(tournamentData);

      // Load players
      const { data: registrationsData, error: registrationsError } = await supabase
        .from('tournament_registrations')
        .select(`
          seed,
          status,
          player_profiles!inner (
            id,
            first_name,
            last_name
          )
        `)
        .eq('tournament_id', tournamentId)
        .order('seed');

      if (registrationsError) throw registrationsError;

      const formattedPlayers = registrationsData.map(reg => ({
        id: reg.player_profiles.id,
        first_name: reg.player_profiles.first_name,
        last_name: reg.player_profiles.last_name,
        registration: {
          seed: reg.seed,
          status: reg.status
        }
      }));

      setPlayers(formattedPlayers);

      // Load active bracket if exists
      const { data: bracketData, error: bracketError } = await supabase
        .from('tournament_brackets')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('status', 'active')
        .maybeSingle();

      if (bracketError) throw bracketError;

      if (bracketData) {
        setBracket(bracketData);
        setBracketConfig({
          bracketType: bracketData.bracket_type,
          format: bracketData.format,
          seeding: bracketData.seeding,
          tablesPerBracket: String(bracketData.tables_per_bracket),
          weightedMatchups: bracketData.weighted_matchups,
          bracketSize: String(bracketData.bracket_size),
          uppersRaceTo: String(bracketData.uppers_race_to),
          lowersRaceTo: String(bracketData.lowers_race_to),
          championshipFormat: bracketData.championship_format,
          bestOf: bracketData.best_of
        });

        // Load matches for the active bracket
        const { data: matchesData, error: matchesError } = await supabase
          .from('tournament_matches')
          .select('*')
          .eq('bracket_id', bracketData.id)
          .order('round')
          .order('match_number');

        if (matchesError) throw matchesError;
        setMatches(matchesData || []);
      } else {
        setBracket(null);
        setMatches([]);
      }
    } catch (error) {
      console.error('Error loading tournament:', error);
      toast.error('Failed to load tournament data');
      navigate('/tournaments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMatch = async (updatedMatch: Match) => {
    try {
      const { error } = await supabase
        .from('tournament_matches')
        .update({
          player1_score: updatedMatch.player1_score,
          player2_score: updatedMatch.player2_score,
          winner_id: updatedMatch.winner_id,
          table_number: updatedMatch.table_number,
          status: updatedMatch.status
        })
        .eq('id', updatedMatch.id);

      if (error) throw error;

      // If match is completed and has a winner, update the next round
      if (updatedMatch.status === 'completed' && updatedMatch.winner_id) {
        const nextRound = updatedMatch.round + 1;
        const nextMatchNumber = Math.ceil(updatedMatch.match_number / 2);

        const { data: nextMatch } = await supabase
          .from('tournament_matches')
          .select('*')
          .eq('bracket_id', updatedMatch.bracket_id)
          .eq('round', nextRound)
          .eq('match_number', nextMatchNumber)
          .single();

        if (nextMatch) {
          // Determine if this winner should be player1 or player2 in the next match
          const isPlayer1 = updatedMatch.match_number % 2 !== 0;
          const updateData = isPlayer1
            ? { player1_id: updatedMatch.winner_id }
            : { player2_id: updatedMatch.winner_id };

          await supabase
            .from('tournament_matches')
            .update(updateData)
            .eq('id', nextMatch.id);
        }
      }

      toast.success('Match updated successfully');
      await loadTournamentData();
    } catch (error) {
      console.error('Error updating match:', error);
      toast.error('Failed to update match');
    }
  };

  const handleCreateBracket = async () => {
    try {
      if (!tournament || players.length < 2) {
        throw new Error('Not enough players to create a bracket');
      }

      // Calculate optimal bracket size
      const sizes = [2, 4, 8, 16, 32, 64];
      const optimalSize = sizes.find(size => size >= players.length) || sizes[sizes.length - 1];
      
      const { data: bracketData, error: bracketError } = await supabase
        .from('tournament_brackets')
        .insert([{
          tournament_id: tournamentId,
          bracket_type: bracketConfig.bracketType,
          format: bracketConfig.format,
          seeding: bracketConfig.seeding,
          tables_per_bracket: parseInt(bracketConfig.tablesPerBracket) || 2,
          weighted_matchups: bracketConfig.weightedMatchups,
          bracket_size: optimalSize,
          uppers_race_to: parseInt(bracketConfig.uppersRaceTo) || 3,
          lowers_race_to: parseInt(bracketConfig.lowersRaceTo) || 3,
          championship_format: bracketConfig.championshipFormat,
          best_of: bracketConfig.bestOf,
          status: 'active'
        }])
        .select()
        .single();

      if (bracketError) throw bracketError;

      // Generate initial matches
      const matches = [];
      const numFirstRoundMatches = optimalSize / 2;
      
      for (let i = 0; i < numFirstRoundMatches; i++) {
        const player1 = players[i * 2];
        const player2 = players[i * 2 + 1];
        
        matches.push({
          bracket_id: bracketData.id,
          round: 1,
          match_number: i + 1,
          player1_id: player1?.id || null,
          player2_id: player2?.id || null,
          table_number: (i % parseInt(bracketConfig.tablesPerBracket)) + 1
        });
      }

      const { error: matchesError } = await supabase
        .from('tournament_matches')
        .insert(matches);

      if (matchesError) throw matchesError;

      toast.success('Tournament bracket created successfully!');
      setShowCreateModal(false);
      loadTournamentData();
    } catch (error) {
      console.error('Error creating bracket:', error);
      toast.error('Failed to create bracket');
    }
  };

  const handleDeleteBracket = async () => {
    try {
      if (!bracket) {
        throw new Error('No active bracket to delete');
      }

      const { error } = await supabase
        .from('tournament_brackets')
        .delete()
        .eq('id', bracket.id);

      if (error) throw error;

      toast.success('Tournament bracket deleted successfully!');
      setShowDeleteConfirm(false);
      setBracket(null);
      setMatches([]);
      loadTournamentData();
    } catch (error) {
      console.error('Error deleting bracket:', error);
      toast.error('Failed to delete bracket');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="h-[600px] bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="max-w-7xl mx-auto p-6 text-center">
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
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(`/tournament/${tournamentId}/admin`)}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{tournament.name}</h1>
            <p className="text-gray-400">Tournament Bracket Management</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Bracket Status */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Bracket Status</h2>
          <div className="flex items-center space-x-2 mb-4">
            {bracket ? (
              <div className="text-green-500 flex items-center space-x-2">
                <Brackets className="w-5 h-5" />
                <span>Active bracket</span>
              </div>
            ) : (
              <div className="text-yellow-500 flex items-center space-x-2">
                <AlertCircle className="w-5 h-5" />
                <span>No active bracket</span>
              </div>
            )}
          </div>
          <div className="space-y-2 text-gray-400">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>{players.length} players registered</span>
            </div>
            {bracket && (
              <>
                <div className="flex items-center space-x-2">
                  <Info className="w-5 h-5" />
                  <span>Format: {bracket.format}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Race to {bracket.uppers_race_to}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bracket Actions */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Bracket Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className={`w-full font-medium py-3 px-4 rounded flex items-center justify-center ${
                bracket || players.length < 2
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
              disabled={!!bracket || players.length < 2}
            >
              <Brackets className="w-5 h-5 mr-2" />
              Create New Bracket
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className={`w-full font-medium py-3 px-4 rounded flex items-center justify-center ${
                !bracket
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
              disabled={!bracket}
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Delete Current Bracket
            </button>
          </div>
        </div>

        {/* Bracket Display */}
        <div className="md:col-span-2 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Current Bracket</h2>
          {bracket ? (
            <BracketDisplay
              matches={matches}
              players={players}
              raceTo={bracket.uppers_race_to}
              onUpdateMatch={handleUpdateMatch}
            />
          ) : (
            <div className="flex items-center justify-center min-h-[400px] border-2 border-dashed border-gray-700 rounded-lg">
              <p className="text-gray-400">
                No active bracket. Create a new bracket to get started.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Bracket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Create Tournament Bracket</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Bracket Type
                  </label>
                  <select
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500"
                    value={bracketConfig.bracketType}
                    onChange={(e) => setBracketConfig(prev => ({
                      ...prev,
                      bracketType: e.target.value as 'single' | 'split'
                    }))}
                  >
                    <option value="single">Single Bracket</option>
                    <option value="split">Split Bracket</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Format
                  </label>
                  <select
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500"
                    value={bracketConfig.format}
                    onChange={(e) => setBracketConfig(prev => ({
                      ...prev,
                      format: e.target.value
                    }))}
                  >
                    <option>Single Elimination</option>
                    <option>Double Elimination</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Seeding
                  </label>
                  <select
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500"
                    value={bracketConfig.seeding}
                    onChange={(e) => setBracketConfig(prev => ({
                      ...prev,
                      seeding: e.target.value
                    }))}
                  >
                    <option>Standard</option>
                    <option>Random</option>
                    <option>Manual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tables Per Bracket
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500"
                    min="1"
                    value={bracketConfig.tablesPerBracket}
                    onChange={(e) => setBracketConfig(prev => ({
                      ...prev,
                      tablesPerBracket: e.target.value
                    }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Race To (Winners)
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500"
                    min="1"
                    value={bracketConfig.uppersRaceTo}
                    onChange={(e) => setBracketConfig(prev => ({
                      ...prev,
                      uppersRaceTo: e.target.value
                    }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Race To (Losers)
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500"
                    min="1"
                    value={bracketConfig.lowersRaceTo}
                    onChange={(e) => setBracketConfig(prev => ({
                      ...prev,
                      lowersRaceTo: e.target.value
                    }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Best Of
                  </label>
                  <select
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500"
                    value={bracketConfig.bestOf}
                    onChange={(e) => setBracketConfig(prev => ({
                      ...prev,
                      bestOf: e.target.value as 'Disabled' | '3' | '5' | '7'
                    }))}
                  >
                    <option>Disabled</option>
                    <option>3</option>
                    <option>5</option>
                    <option>7</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="weightedMatchups"
                  className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                  checked={bracketConfig.weightedMatchups}
                  onChange={(e) => setBracketConfig(prev => ({
                    ...prev,
                    weightedMatchups: e.target.checked
                  }))}
                />
                <label htmlFor="weightedMatchups" className="text-sm font-medium">
                  Enable Weighted Matchups
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBracket}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded flex items-center"
                >
                  <Save className="w-5 h-5 mr-2" />
                  Create Bracket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Delete Bracket</h3>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-yellow-500">
                <AlertCircle className="w-5 h-5" />
                <p>Are you sure you want to delete the current bracket?</p>
              </div>
              <p className="text-gray-400">
                This action cannot be undone. All matches and progress will be lost.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteBracket}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded flex items-center"
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  Delete Bracket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}