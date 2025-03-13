import React, { useState } from 'react';
import { Trophy, Save } from 'lucide-react';
import clsx from 'clsx';

interface Match {
  id: string;
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

interface Player {
  id: string;
  first_name: string;
  last_name: string;
}

interface BracketDisplayProps {
  matches: Match[];
  players: Player[];
  raceTo: number;
  onUpdateMatch?: (match: Match) => Promise<void>;
}

interface EditModalProps {
  match: Match;
  players: Player[];
  raceTo: number;
  onClose: () => void;
  onSave: (match: Match) => Promise<void>;
}

function EditModal({ match, players, raceTo, onClose, onSave }: EditModalProps) {
  const [scores, setScores] = useState({
    player1: match.player1_score,
    player2: match.player2_score
  });
  const [status, setStatus] = useState(match.status);
  const [table, setTable] = useState(match.table_number);

  const getPlayerName = (playerId: string | null) => {
    if (!playerId) return 'TBD';
    const player = players.find(p => p.id === playerId);
    return player ? `${player.first_name} ${player.last_name}` : 'TBD';
  };

  const handleSave = async () => {
    let winner_id = null;
    if (scores.player1 >= raceTo) {
      winner_id = match.player1_id;
    } else if (scores.player2 >= raceTo) {
      winner_id = match.player2_id;
    }

    await onSave({
      ...match,
      player1_score: scores.player1,
      player2_score: scores.player2,
      table_number: table,
      status,
      winner_id
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Edit Match</h3>
        
        <div className="space-y-4">
          {/* Player 1 Score */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {getPlayerName(match.player1_id)}
            </label>
            <input
              type="number"
              min="0"
              max={raceTo}
              value={scores.player1}
              onChange={(e) => setScores(prev => ({ ...prev, player1: parseInt(e.target.value) || 0 }))}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600"
            />
          </div>

          {/* Player 2 Score */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {getPlayerName(match.player2_id)}
            </label>
            <input
              type="number"
              min="0"
              max={raceTo}
              value={scores.player2}
              onChange={(e) => setScores(prev => ({ ...prev, player2: parseInt(e.target.value) || 0 }))}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600"
            />
          </div>

          {/* Table Number */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Table Number
            </label>
            <input
              type="number"
              min="1"
              value={table}
              onChange={(e) => setTable(parseInt(e.target.value) || 1)}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600"
            />
          </div>

          {/* Match Status */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Match['status'])}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded flex items-center justify-center"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BracketDisplay({ matches, players, raceTo, onUpdateMatch }: BracketDisplayProps) {
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  const getPlayerName = (playerId: string | null) => {
    if (!playerId) return 'TBD';
    const player = players.find(p => p.id === playerId);
    return player ? `${player.first_name} ${player.last_name}` : 'TBD';
  };

  // Group matches by round
  const roundMatches = matches.reduce((acc, match) => {
    if (!acc[match.round]) {
      acc[match.round] = [];
    }
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  // Sort rounds and matches within each round
  const rounds = Object.entries(roundMatches)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([round, matches]) => ({
      round: Number(round),
      matches: matches.sort((a, b) => a.match_number - b.match_number)
    }));

  // Calculate dimensions and spacing
  const matchWidth = 240;
  const matchHeight = 80;
  const horizontalGap = 100;
  const verticalGap = 40;

  // Calculate total height needed for the bracket
  const maxMatchesInRound = Math.max(...rounds.map(r => r.matches.length));
  const totalHeight = maxMatchesInRound * matchHeight + (maxMatchesInRound - 1) * verticalGap;

  const handleMatchClick = (match: Match) => {
    if (onUpdateMatch) {
      setEditingMatch(match);
    }
  };

  return (
    <div className="w-full overflow-x-auto bg-gray-900 p-8">
      <div className="relative flex" style={{ gap: `${horizontalGap}px` }}>
        {rounds.map((round, roundIndex) => {
          const matchCount = round.matches.length;
          const roundHeight = totalHeight;
          const matchSpacing = roundHeight / matchCount;
          const nextRoundMatchCount = rounds[roundIndex + 1]?.matches.length || 0;

          return (
            <div 
              key={round.round}
              className="relative flex flex-col"
              style={{ 
                gap: `${matchSpacing - matchHeight}px`,
                height: roundHeight
              }}
            >
              {/* Round Label */}
              <div className="absolute -top-8 left-0 text-sm font-medium text-gray-400">
                {round.round === rounds.length ? 'Final' :
                 round.round === rounds.length - 1 ? 'Semifinals' :
                 `Round ${round.round}`}
              </div>

              {/* Connector Lines */}
              {roundIndex < rounds.length - 1 && (
                <svg
                  className="absolute -right-[101px] top-0 h-full w-[102px]"
                  style={{
                    height: roundHeight,
                    pointerEvents: 'none'
                  }}
                >
                  {round.matches.map((match, matchIndex) => {
                    const y1 = matchIndex * matchSpacing + matchHeight / 2;
                    const nextMatchIndex = Math.floor(matchIndex / 2);
                    const y2 = nextMatchIndex * (roundHeight / nextRoundMatchCount) + matchHeight / 2;

                    return (
                      <g key={`connector-${match.id}`}>
                        <line
                          x1="0"
                          y1={y1}
                          x2={horizontalGap}
                          y2={y2}
                          stroke="#4B5563"
                          strokeWidth="2"
                        />
                      </g>
                    );
                  })}
                </svg>
              )}

              {/* Matches */}
              {round.matches.map((match, matchIndex) => (
                <div
                  key={match.id}
                  onClick={() => handleMatchClick(match)}
                  className={clsx(
                    "w-[240px] bg-gray-800 rounded-lg overflow-hidden shadow-lg cursor-pointer transition-transform hover:scale-105",
                    match.status === 'in_progress' && "ring-2 ring-green-500",
                    match.status === 'completed' && match.winner_id && "ring-2 ring-gray-500"
                  )}
                  style={{
                    marginTop: matchIndex === 0 ? matchSpacing * matchIndex : 0
                  }}
                >
                  {/* Match Header */}
                  <div className="px-4 py-2 bg-gray-900/50 flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                      Match {match.match_number}
                    </span>
                    <div className="flex items-center space-x-2">
                      {match.status === 'in_progress' && (
                        <span className="px-2 py-0.5 text-xs bg-green-600 text-white rounded-full">
                          In Progress
                        </span>
                      )}
                      {match.table_number && (
                        <span className="text-xs text-gray-400">
                          Table {match.table_number}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Player 1 */}
                  <div className={clsx(
                    "px-4 py-2 flex justify-between items-center",
                    match.winner_id === match.player1_id && "bg-purple-900/30"
                  )}>
                    <div className="flex items-center space-x-2">
                      {match.winner_id === match.player1_id && (
                        <Trophy className="w-4 h-4 text-yellow-500" />
                      )}
                      <span className={clsx(
                        "font-medium",
                        match.winner_id === match.player1_id ? "text-white" : "text-gray-400"
                      )}>
                        {getPlayerName(match.player1_id)}
                      </span>
                    </div>
                    <span className="text-lg font-semibold">
                      {match.player1_score}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gray-700" />

                  {/* Player 2 */}
                  <div className={clsx(
                    "px-4 py-2 flex justify-between items-center",
                    match.winner_id === match.player2_id && "bg-purple-900/30"
                  )}>
                    <div className="flex items-center space-x-2">
                      {match.winner_id === match.player2_id && (
                        <Trophy className="w-4 h-4 text-yellow-500" />
                      )}
                      <span className={clsx(
                        "font-medium",
                        match.winner_id === match.player2_id ? "text-white" : "text-gray-400"
                      )}>
                        {getPlayerName(match.player2_id)}
                      </span>
                    </div>
                    <span className="text-lg font-semibold">
                      {match.player2_score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editingMatch && onUpdateMatch && (
        <EditModal
          match={editingMatch}
          players={players}
          raceTo={raceTo}
          onClose={() => setEditingMatch(null)}
          onSave={onUpdateMatch}
        />
      )}
    </div>
  );
}