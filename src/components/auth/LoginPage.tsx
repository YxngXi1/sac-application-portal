
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const { signInWithGoogle, loading } = useAuth();
  const [error, setError] = useState<string>('');

  const handleSignIn = async () => {
    try {
      setError('');
      console.log('Starting sign in process...');
      await signInWithGoogle();
    } catch (error: any) {
      console.error('Sign in error:', error);
      setError(error.message || 'Failed to sign in. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/8a63f40b-6935-4ee7-b788-560b8353aa1e.png" 
              alt="SAC John Fraser" 
              className="h-16 w-auto"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            SAC Application Portal
          </CardTitle>
          <CardDescription className="text-gray-600">
            Sign in with your PDSB Google account to apply for Student Council positions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Button 
            onClick={handleSignIn}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </Button>
          
          <div className="text-xs text-gray-500 text-center space-y-1">
            <p><strong>IMPORTANT:</strong> Only John Fraser Secondary School PDSB accounts are permitted</p>
            <p className="font-medium text-red-600">Must use @pdsb.net email address</p>
            <p className="text-gray-400">If you don't have a PDSB account, contact your teacher</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
