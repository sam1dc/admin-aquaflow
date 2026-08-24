import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { router } from './router';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster position="bottom-right" toastOptions={{
        className: 'bg-background-card text-text-main border border-border shadow-lg',
        style: {
          background: 'var(--color-background-card)',
          color: 'var(--color-text-main)',
          border: '1px solid var(--color-border)'
        },
      }} />
    </AuthProvider>
  );
}

export default App;
