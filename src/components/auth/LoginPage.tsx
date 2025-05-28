
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { cn } from "@/lib/utils";

// Inline components to match the provided design
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-6", className)}
      {...props}
    />
  )
);
CardContent.displayName = "CardContent";

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'default' | 'outline' | 'link';
    size?: 'default' | 'lg';
  }
>(({ className, variant = 'default', size = 'default', ...props }, ref) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
    outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline"
  };
  const sizes = {
    default: "h-9 px-4 py-2",
    lg: "h-10 px-6"
  };
  
  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";

const GoogleIcon = ({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" className={cn("w-4 h-4", className)} fill="currentColor" {...props}>
    <path d="M3.06364 7.50914C4.70909 4.24092 8.09084 2 12 2C14.6954 2 16.959 2.99095 18.6909 4.60455L15.8227 7.47274C14.7864 6.48185 13.4681 5.97727 12 5.97727C9.39542 5.97727 7.19084 7.73637 6.40455 10.1C6.2045 10.7 6.09086 11.3409 6.09086 12C6.09086 12.6591 6.2045 13.3 6.40455 13.9C7.19084 16.2636 9.39542 18.0227 12 18.0227C13.3454 18.0227 14.4909 17.6682 15.3864 17.0682C16.4454 16.3591 17.15 15.3 17.3818 14.05H12V10.1818H21.4181C21.5364 10.8363 21.6 11.5182 21.6 12.2273C21.6 15.2727 20.5091 17.8363 18.6181 19.5773C16.9636 21.1046 14.7 22 12 22C8.09084 22 4.70909 19.7591 3.06364 16.4909C2.38638 15.1409 2 13.6136 2 12C2 10.3864 2.38638 8.85911 3.06364 7.50914Z" />
  </svg>
);

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
    <div className="flex items-center justify-center min-h-screen bg-white">
      <Card className="w-full max-w-sm rounded-xl px-6 py-10 pt-14">
        <CardContent>
          <div className="flex flex-col items-center space-y-8">
            <img 
              src="/lovable-uploads/8a63f40b-6935-4ee7-b788-560b8353aa1e.png" 
              alt="SAC John Fraser" 
              className="h-12 w-auto"
            />

            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-semibold text-foreground">
                Login to Apply!
              </h1>
              <p className="text-muted-foreground text-sm">
                Sign in with your PDSB account to apply
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="border-red-500 w-full">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="w-full space-y-4">
              <Button 
                onClick={handleSignIn}
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white" 
                size="lg"
              >
                <GoogleIcon className="mr-2" />
                {loading ? 'Signing in...' : 'Sign in with Google'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
