import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AccountMode = 'personal' | 'business';

interface BusinessAccount {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
}

interface AccountModeContextType {
  accountMode: AccountMode;
  setAccountMode: (mode: AccountMode) => Promise<void>;
  businessAccount: BusinessAccount | null;
  loading: boolean;
}

const AccountModeContext = createContext<AccountModeContextType>({
  accountMode: 'personal',
  setAccountMode: async () => {},
  businessAccount: null,
  loading: true,
});

export const useAccountMode = () => useContext(AccountModeContext);

export function AccountModeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [accountMode, setAccountModeState] = useState<AccountMode>('personal');
  const [businessAccount, setBusinessAccount] = useState<BusinessAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAccountModeState('personal');
      setBusinessAccount(null);
      setLoading(false);
      return;
    }

    const loadAccountData = async () => {
      try {
        // Get user's current account mode
        const { data: profile } = await supabase
          .from('profiles')
          .select('active_account_mode')
          .eq('id', user.id)
          .single();

        if (profile?.active_account_mode) {
          setAccountModeState(profile.active_account_mode as AccountMode);
        }

        // Check if user owns a business account
        const { data: business } = await supabase
          .from('business_accounts')
          .select('id, name, logo_url, description')
          .eq('owner_id', user.id)
          .single();

        setBusinessAccount(business);
      } catch (error) {
        console.error('Error loading account data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAccountData();
  }, [user]);

  const setAccountMode = async (mode: AccountMode) => {
    if (!user) return;

    if (mode === 'business' && !businessAccount) {
      toast.error('You need to create a business account first');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ active_account_mode: mode })
        .eq('id', user.id);

      if (error) throw error;

      setAccountModeState(mode);
      toast.success(`Switched to ${mode} account`);
    } catch (error) {
      console.error('Error switching account mode:', error);
      toast.error('Failed to switch account mode');
    }
  };

  return (
    <AccountModeContext.Provider 
      value={{ 
        accountMode, 
        setAccountMode, 
        businessAccount,
        loading 
      }}
    >
      {children}
    </AccountModeContext.Provider>
  );
}
