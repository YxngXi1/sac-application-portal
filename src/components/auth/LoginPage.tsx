
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const LoginPage = () => {
  const { signInWithGoogle, loading } = useAuth();

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
            Sign in with your school Google account to apply for Student Council positions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </Button>
          <p className="text-xs text-gray-500 text-center mt-4">
            Only John Fraser Secondary School Google accounts are permitted
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
