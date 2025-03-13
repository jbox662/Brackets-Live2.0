import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Search, PlusSquare } from 'lucide-react';

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Welcome to Billiards Tournament</h1>
        <p className="text-gray-400 text-lg">
          Find tournaments, organize competitions, and track your billiards journey
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Link
          to="/tournaments"
          className="bg-gray-800 p-6 rounded-lg shadow-lg hover:bg-gray-700 transition-colors"
        >
          <div className="flex flex-col items-center text-center">
            <Search className="h-12 w-12 mb-4 text-blue-500" />
            <h2 className="text-xl font-semibold mb-2">Find Tournaments</h2>
            <p className="text-gray-400">
              Browse upcoming tournaments in your area
            </p>
          </div>
        </Link>

        <Link
          to="/organize"
          className="bg-gray-800 p-6 rounded-lg shadow-lg hover:bg-gray-700 transition-colors"
        >
          <div className="flex flex-col items-center text-center">
            <PlusSquare className="h-12 w-12 mb-4 text-green-500" />
            <h2 className="text-xl font-semibold mb-2">Organize Tournament</h2>
            <p className="text-gray-400">
              Create and manage your own tournaments
            </p>
          </div>
        </Link>

        <Link
          to="/profile"
          className="bg-gray-800 p-6 rounded-lg shadow-lg hover:bg-gray-700 transition-colors"
        >
          <div className="flex flex-col items-center text-center">
            <Trophy className="h-12 w-12 mb-4 text-yellow-500" />
            <h2 className="text-xl font-semibold mb-2">Player Profile</h2>
            <p className="text-gray-400">
              Track your stats and tournament history
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}