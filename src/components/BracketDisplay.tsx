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
  table_number: number | null;
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
  const [table, setTable] = useState<number | null>(match.table_number);

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

          <div>
            <label className="block text-sm font-medium mb-1">
              Table Number
            </label>
            <input
              type="number"
              min="1"
              value={table || ''}
              onChange={(e) => setTable(parseInt(e.target.value) || null)}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600"
              placeholder={match.round === 1 ? 'Assign table number' : 'Will be assigned when match starts'}
              disabled={match.round !== 1}
            />
          </div>

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
  const horizontalGap = 160;
  const verticalGap = 40;

  // Calculate total height needed for the bracket
  const maxMatchesInRound = Math.max(...rounds.map(r => r.matches.length));
  const totalHeight = maxMatchesInRound * (matchHeight + verticalGap) * 2;

  const handleMatchClick = (match: Match) => {
    if (onUpdateMatch) {
      setEditingMatch(match);
    }
  };

  return (
    <div className="w-full overflow-x-auto bg-gray-900 p-8">
      <div className="relative flex items-center justify-center min-w-fit" style={{ gap: `${horizontalGap}px` }}>
        {rounds.map((round, roundIndex) => {
          const matchCount = round.matches.length;
          const roundSpacing = totalHeight / matchCount;
          const nextRoundMatchCount = rounds[roundIndex + 1]?.matches.length || 1;

          return (
            <div 
              key={round.round}
              className="relative flex flex-col"
              style={{ 
                gap: roundSpacing - matchHeight,
                minHeight: totalHeight
              }}
            >
              {/* Round Label */}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-sm font-medium text-gray-400">
                {round.round === rounds.length ? 'Final' :
                 round.round === rounds.length - 1 ? 'Semifinals' :
                 `Round ${round.round}`}
              </div>

              {/* Connector Lines */}
              {roundIndex < rounds.length - 1 && (
                <svg
                  className="absolute -right-[161px] top-0 w-[162px]"
                  style={{
                    height: totalHeight,
                    pointerEvents: 'none'
                  }}
                >
                  {round.matches.map((match, matchIndex) => {
                    if (matchIndex % 2 === 0 && matchIndex + 1 < round.matches.length) {
                      const match1Y = matchIndex * roundSpacing + matchHeight / 2;
                      const match2Y = (matchIndex + 1) * roundSpacing + matchHeight / 2;
                      const nextMatchIndex = Math.floor(matchIndex / 2);
                      const nextMatchY = nextMatchIndex * (totalHeight / nextRoundMatchCount) + matchHeight / 2;

                      return (
                        <g key={`connector-${match.id}`}>
                          {/* Horizontal lines from matches */}
                          <line
                            x1="0"
                            y1={match1Y}
                            x2={horizontalGap / 2}
                            y2={match1Y}
                            stroke="#4B5563"
                            strokeWidth="2"
                          />
                          <line
                            x1="0"
                            y1={match2Y}
                            x2={horizontalGap / 2}
                            y2={match2Y}
                            stroke="#4B5563"
                            strokeWidth="2"
                          />
                          {/* Vertical connector */}
                          <line
                            x1={horizontalGap / 2}
                            y1={match1Y}
                            x2={horizontalGap / 2}
                            y2={match2Y}
                            stroke="#4B5563"
                            strokeWidth="2"
                          />
                          {/* Line to next match */}
                          <line
                            x1={horizontalGap / 2}
                            y1={(match1Y + match2Y) / 2}
                            x2={horizontalGap}
                            y2={nextMatchY}
                            stroke="#4B5563"
                            strokeWidth="2"
                          />
                        </g>
                      );
                    }
                    return null;
                  })}
                </svg>
              )}

              {/* Matches */}
              {round.matches.map((match, matchIndex) => (
                <div
                  key={match.id}
                  onClick={() => handleMatchClick(match)}
                  className={clsx(
                    "w-[240px] bg-purple-900/80 rounded overflow-hidden shadow-lg cursor-pointer transition-transform hover:scale-105",
                    match.status === 'in_progress' && "ring-2 ring-green-500",
                    match.status === 'completed' && match.winner_id && "ring-2 ring-gray-500"
                  )}
                  style={{
                    marginTop: matchIndex === 0 ? roundSpacing / 2 : 0
                  }}
                >
                  {/* Match Header */}
                  <div className="px-4 py-2 bg-black/20 flex justify-between items-center text-xs text-gray-300">
                    <span>Match {match.match_number}</span>
                    {match.table_number && (
                      <span>Table {match.table_number}</span>
                    )}
                  </div>

                  {/* Player 1 */}
                  <div className={clsx(
                    "px-4 py-2 flex justify-between items-center",
                    match.winner_id === match.player1_id && "bg-purple-800"
                  )}>
                    <div className="flex items-center space-x-2">
                      {match.winner_id === match.player1_id && (
                        <Trophy className="w-4 h-4 text-yellow-500" />
                      )}
                      <span className={clsx(
                        "font-medium",
                        match.winner_id === match.player1_id ? "text-white" : "text-gray-300"
                      )}>
                        {getPlayerName(match.player1_id)}
                      </span>
                    </div>
                    <span className="text-lg font-medium">
                      {match.player1_score}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-black/20" />

                  {/* Player 2 */}
                  <div className={clsx(
                    "px-4 py-2 flex justify-between items-center",
                    match.winner_id === match.player2_id && "bg-purple-800"
                  )}>
                    <div className="flex items-center space-x-2">
                      {match.winner_id === match.player2_id && (
                        <Trophy className="w-4 h-4 text-yellow-500" />
                      )}
                      <span className={clsx(
                        "font-medium",
                        match.winner_id === match.player2_id ? "text-white" : "text-gray-300"
                      )}>
                        {getPlayerName(match.player2_id)}
                      </span>
                    </div>
                    <span className="text-lg font-medium">
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