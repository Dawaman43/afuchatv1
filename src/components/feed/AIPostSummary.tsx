import { useState } from 'react';
import { Sparkles, Crown, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomLoader } from '@/components/ui/CustomLoader';
import { supabase } from '@/integrations/supabase/client';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface AIPostSummaryProps {
  postContent: string;
  postId: string;
}

export const AIPostSummary = ({ postContent, postId }: AIPostSummaryProps) => {
  const { isPremium } = usePremiumStatus();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Only show for longer posts
  if (postContent.length < 150) return null;

  const generateSummary = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isPremium) {
      toast.error('AI Summary is a premium feature');
      navigate('/premium');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('chat-with-afuai', {
        body: {
          message: `Summarize this social media post in 1-2 concise sentences. Focus on the main point or message:\n\n"${postContent}"`,
          context: 'post_summary'
        }
      });

      if (error) throw error;
      setSummary(data?.reply || 'Unable to generate summary');
      setExpanded(true);
    } catch (error) {
      console.error('AI Summary error:', error);
      toast.error('Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="mt-2 mx-0"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-lg border border-primary/20 overflow-hidden">
        <div 
          className="flex items-center justify-between px-3 py-2 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            if (summary) setExpanded(!expanded);
          }}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-foreground">AfuAI Summary</span>
            {!isPremium && (
              <span className="flex items-center gap-0.5 text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                <Crown className="h-2.5 w-2.5" />
                Premium
              </span>
            )}
          </div>
          
          {summary && (
            expanded ? 
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : 
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>

        <AnimatePresence>
          {(expanded || !summary) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-2">
                {loading ? (
                  <div className="flex items-center justify-center py-2">
                    <CustomLoader size="sm" />
                  </div>
                ) : summary ? (
                  <p className="text-xs text-foreground/90 leading-relaxed bg-background/50 rounded p-2">
                    {summary}
                  </p>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generateSummary}
                    className="w-full h-7 justify-center gap-1.5 text-xs text-primary hover:text-primary hover:bg-primary/10"
                  >
                    <Sparkles className="h-3 w-3" />
                    Get Summary
                    {!isPremium && <Crown className="h-2.5 w-2.5 text-amber-500" />}
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
