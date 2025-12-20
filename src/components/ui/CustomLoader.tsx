import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CustomLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export const CustomLoader = ({ size = 'md', className, text }: CustomLoaderProps) => {
  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const containerSizes = {
    sm: 'gap-1',
    md: 'gap-1.5',
    lg: 'gap-2'
  };

  const dotVariants = {
    initial: { y: 0, scale: 0.8, opacity: 0.3 },
    animate: { 
      y: [-8, 0, -8],
      scale: [0.8, 1.2, 0.8],
      opacity: [0.3, 1, 0.3]
    }
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div className={cn('flex items-center', containerSizes[size])}>
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className={cn(
              'rounded-full bg-gradient-to-br from-primary via-primary to-accent shadow-lg shadow-primary/30',
              sizes[size]
            )}
            variants={dotVariants}
            initial="initial"
            animate="animate"
            transition={{
              duration: 0.7,
              repeat: Infinity,
              ease: [0.4, 0, 0.2, 1],
              delay: index * 0.12
            }}
          />
        ))}
      </div>
      {text && (
        <motion.p
          className="text-sm font-medium text-muted-foreground"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

// Full page loader - for initial page loads
export const PageLoader = ({ text = 'Loading...' }: { text?: string }) => {
  return (
    <motion.div 
      className="flex min-h-screen items-center justify-center bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <CustomLoader size="lg" text={text} />
    </motion.div>
  );
};

// Inline loader - for sections/cards
export const InlineLoader = ({ text, className }: { text?: string; className?: string }) => {
  return (
    <motion.div 
      className={cn('flex items-center justify-center py-8', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <CustomLoader size="md" text={text} />
    </motion.div>
  );
};

// Card loader - for loading content within cards
export const CardLoader = ({ className }: { className?: string }) => {
  return (
    <motion.div 
      className={cn('flex items-center justify-center min-h-[120px]', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <CustomLoader size="sm" />
    </motion.div>
  );
};

// List loader - for loading lists
export const ListLoader = ({ rows = 5, className }: { rows?: number; className?: string }) => {
  return (
    <motion.div 
      className={cn('flex flex-col items-center justify-center py-12', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <CustomLoader size="md" text="Loading..." />
    </motion.div>
  );
};

// Button loader - for buttons
export const ButtonLoader = ({ className }: { className?: string }) => {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1 h-1 rounded-full bg-current"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ 
            duration: 0.5, 
            repeat: Infinity, 
            delay: i * 0.1,
            ease: "easeInOut"
          }}
        />
      ))}
    </span>
  );
};

// Section loader - replaces skeleton for page sections
export const SectionLoader = ({ className, text }: { className?: string; text?: string }) => {
  return (
    <motion.div 
      className={cn('flex items-center justify-center py-16', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <CustomLoader size="md" text={text} />
    </motion.div>
  );
};
