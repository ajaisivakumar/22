import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">403</h1>
      <h2 className="text-xl font-bold text-gray-800 mt-2">Restricted Access</h2>
      <p className="text-sm text-gray-500 max-w-sm mt-1">
        You do not have administrative clearance to access this module. Please login with an administrator college account.
      </p>

      <div className="mt-6 flex gap-3">
        <Link to="/">
          <Button variant="secondary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Dashboard
          </Button>
        </Link>
        <Link to="/login">
          <Button variant="primary">
            Sign In with Admin Account
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
