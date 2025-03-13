import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import toast from 'react-hot-toast';

export default function Registration() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [showQR, setShowQR] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would save to a database
    setShowQR(true);
    toast.success('Registration successful!');
  };

  return (
    <div className="max-w-md mx-auto">
      {!showQR ? (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-6">Player Registration</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Name
              </label>
              <input
                type="text"
                id="name"
                required
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                required
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition duration-150"
            >
              Register
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold mb-6">Your QR Code</h2>
          <div className="bg-white p-4 rounded-lg inline-block mb-4">
            <QRCode value={formData.email} />
          </div>
          <p className="mb-4">
            Save this QR code for check-in at the tournament.
          </p>
          <button
            onClick={() => navigate('/tournaments')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition duration-150"
          >
            View Tournaments
          </button>
        </div>
      )}
    </div>
  );
}