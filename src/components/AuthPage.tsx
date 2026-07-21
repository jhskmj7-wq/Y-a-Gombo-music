import React from 'react';
import { useNavigate } from 'react-router-dom';
import AuthScreen from './AuthScreen';

export default function AuthPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-afri-bg-sec flex items-center justify-center p-4">
      <div className="w-full max-w-sm relative">
        <AuthScreen 
          onSuccess={() => {
            navigate("/home", { replace: true });
          }} 
          onClose={() => {
            // Optional: Handle close if they want to browse as guest
            navigate("/home", { replace: true });
          }}
        />
      </div>
    </div>
  );
}
