
import React from 'react';
import { Button } from '@/components/ui/button';
import { ShuffleHero } from '@/components/ui/shuffle-grid';

const LandingPage = () => {
  const handleApplyClick = () => {
    // This will trigger the sign-in flow since clicking will show LoginPage
    // when user is not authenticated
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Shuffle Grid */}
      <section className="min-h-screen flex items-center justify-center px-4 py-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <img 
              src="/lovable-uploads/8a63f40b-6935-4ee7-b788-560b8353aa1e.png" 
              alt="SAC John Fraser" 
              className="h-24 w-auto mx-auto mb-6"
            />
          </div>
          
          <ShuffleHero />
          
          <div className="text-center mt-12">
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
              onClick={handleApplyClick}
            >
              Apply Now
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
