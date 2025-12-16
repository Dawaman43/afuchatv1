import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import afumailLogo from '@/assets/mini-apps/afumail-logo.png';

export default function AfuMail() {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center gap-4 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <img src={afumailLogo} alt="AfuMail" className="h-8 w-8 rounded-lg" />
          <h1 className="text-lg font-bold text-blue-600">AfuMail</h1>
        </div>
      </header>

      {/* Coming Soon Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-6">
          <div className="relative mx-auto w-32 h-32">
            <img 
              src={afumailLogo} 
              alt="AfuMail" 
              className="w-full h-full rounded-2xl shadow-lg"
            />
            <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-blue-600">Coming Soon</h2>
            <p className="text-lg text-muted-foreground">
              AfuMail is currently under development.
            </p>
            <p className="text-sm text-muted-foreground">
              We're working hard to bring you a seamless email experience. Stay tuned for updates!
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Have questions? Contact us at{' '}
              <a 
                href="mailto:support@afuchat.com" 
                className="font-semibold underline hover:no-underline"
              >
                support@afuchat.com
              </a>
            </p>
          </div>

          <Button onClick={() => navigate(-1)} className="w-full">
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
