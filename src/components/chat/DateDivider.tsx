import { format, isToday, isYesterday } from 'date-fns';

export const DateDivider = ({ date }: { date: string | Date }) => {
  const d = new Date(date);
  let content = '';

  if (isToday(d)) {
    content = 'Today';
  } else if (isYesterday(d)) {
    content = 'Yesterday';
  } else {
    content = format(d, 'MMMM d, yyyy');
  }

  return (
    <div className="flex items-center justify-center py-4">
      <div className="bg-muted px-3 py-1 rounded-full text-xs font-semibold text-muted-foreground">
        {content}
      </div>
    </div>
  );
};
