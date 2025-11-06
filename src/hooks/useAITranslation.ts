import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TranslationCache {
  [key: string]: string;
}

export const useAITranslation = () => {
  const [translationCache, setTranslationCache] = useState<TranslationCache>({});
  const [loading, setLoading] = useState(false);

  const translateText = useCallback(async (
    text: string,
    targetLanguage: string
  ): Promise<string> => {
    // Check cache first
    const cacheKey = `${text}-${targetLanguage}`;
    if (translationCache[cacheKey]) {
      return translationCache[cacheKey];
    }

    // Don't translate if target is English and text appears to be English
    if (targetLanguage === 'en' && /^[a-zA-Z0-9\s.,!?'"@#$%&*()_+=\-[\]{}:;<>\/\\]+$/.test(text)) {
      return text;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return text;
      }

      const response = await fetch(
        'https://rhnsjqqtdzlkvqazfcbg.supabase.co/functions/v1/translate-post',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            text,
            targetLanguage,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      const translatedText = data.translatedText || text;

      // Cache the translation
      setTranslationCache(prev => ({
        ...prev,
        [cacheKey]: translatedText,
      }));

      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    } finally {
      setLoading(false);
    }
  }, [translationCache]);

  return { translateText, loading };
};
