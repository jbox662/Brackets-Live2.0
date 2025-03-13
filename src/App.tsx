import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Tournaments from './pages/Tournaments';
import OrganizeTournament from './pages/OrganizeTournament';
import TournamentAdmin from './pages/TournamentAdmin';
import TournamentBracket from './pages/TournamentBracket';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="profile" element={<Profile />} />
            <Route path="tournaments" element={<Tournaments />} />
            <Route path="organize" element={<OrganizeTournament />} />
            <Route path="tournament/:tournamentId/admin" element={<TournamentAdmin />} />
            <Route path="tournament/:tournamentId/bracket" element={<TournamentBracket />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;