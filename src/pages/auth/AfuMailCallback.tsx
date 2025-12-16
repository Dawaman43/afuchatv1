import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CustomLoader } from '@/components/ui/CustomLoader';
import { toast } from 'sonner';

const AfuMailCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError(searchParams.get('error_description') || 'Authorization failed');
        return;
      }

      if (!code) {
        setError('No authorization code received');
        return;
      }

      // Verify state matches what we stored
      const storedState = sessionStorage.getItem('afumail_oauth_state');
      if (state !== storedState) {
        setError('Invalid state parameter');
        return;
      }

      try {
        // Exchange code for tokens via our edge function
        const { data: tokenData, error: tokenError } = await supabase.functions.invoke('afumail-auth', {
          body: {
            grant_type: 'authorization_code',
            code,
            user_id: 'oauth_signup',
          },
        });

        if (tokenError || !tokenData?.access_token) {
          throw new Error(tokenError?.message || 'Failed to exchange authorization code');
        }

        // Get user info from AfuMail
        const userInfoResponse = await fetch('https://vfcukxlzqfeehhkiogpf.supabase.co/functions/v1/afumail-api/api/user/me', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
        });

        if (!userInfoResponse.ok) {
          throw new Error('Failed to get user info from AfuMail');
        }

        const userInfo = await userInfoResponse.json();
        const afumailEmail = userInfo.email;
        const name = userInfo.name || afumailEmail.split('@')[0];

        // Get signup data if this is coming from signup flow
        const pendingSignupData = localStorage.getItem('pendingSignupData');
        const signupData = pendingSignupData ? JSON.parse(pendingSignupData) : null;
        const isSignupFlow = sessionStorage.getItem('afumail_oauth_flow') === 'signup';

        // Store AfuMail tokens
        localStorage.setItem('afumail_access_token', tokenData.access_token);
        if (tokenData.refresh_token) {
          localStorage.setItem('afumail_refresh_token', tokenData.refresh_token);
        }

        // New user - create account
        if (!isSignupFlow) {
          toast.error('No account found. Please sign up first.');
          navigate('/auth/signup');
          return;
        }

        // Generate a secure password for AfuMail users
        const afumailPassword = `afumail_${userInfo.id}_${crypto.randomUUID().slice(0, 8)}`;
        
        // Create the account
        const { error: signUpError } = await supabase.auth.signUp({
          email: afumailEmail,
          password: afumailPassword,
          options: {
            data: {
              display_name: name,
              afumail_user_id: userInfo.id,
              country: signupData?.country,
              is_business_mode: signupData?.is_business_mode,
            },
            emailRedirectTo: `${window.location.origin}/complete-profile`,
          },
        });

        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            toast.info('This email is already registered. Please sign in with your existing credentials.');
            navigate('/auth/signin');
            return;
          }
          throw signUpError;
        }

        // Clean up
        localStorage.removeItem('pendingSignupData');
        sessionStorage.removeItem('afumail_oauth_state');
        sessionStorage.removeItem('afumail_oauth_flow');

        toast.success('Account created with AfuMail! Complete your profile.');
        navigate('/complete-profile');
      } catch (err: unknown) {
        console.error('AfuMail OAuth error:', err);
        const message = err instanceof Error ? err.message : 'Authentication failed';
        setError(message);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-xl font-semibold text-foreground">Authentication Failed</h1>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => navigate('/auth/signin')}
            className="text-primary underline"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <CustomLoader size="lg" />
      <p className="mt-4 text-muted-foreground">Authenticating with AfuMail...</p>
    </div>
  );
};

export default AfuMailCallback;
