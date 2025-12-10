import { FileText, Download } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAttachmentUrl } from '@/hooks/useAttachmentUrl';
import { ImageLightbox } from '@/components/ui/ImageLightbox';

interface AttachmentPreviewProps {
  url: string;
  type: string;
  name: string;
  size?: number;
  isOwn?: boolean;
  onDownload?: () => void;
}

export const AttachmentPreview = ({ 
  url, 
  type, 
  name, 
  size,
  isOwn = false,
  onDownload 
}: AttachmentPreviewProps) => {
  const { url: signedUrl, loading } = useAttachmentUrl(url);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const isImage = type.startsWith('image/');
  
  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleImageClick = () => {
    if (isImage && signedUrl) {
      setLightboxOpen(true);
    }
  };

  if (loading) {
    return <div className="w-[220px] h-[160px] bg-muted/50 rounded-lg animate-pulse" />;
  }

  if (isImage && signedUrl) {
    return (
      <>
        <div 
          className="relative w-[220px] h-[160px] rounded-lg overflow-hidden cursor-pointer group"
          onClick={handleImageClick}
        >
          <img 
            src={signedUrl} 
            alt={name}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </div>
        {lightboxOpen && createPortal(
          <ImageLightbox
            images={[{ url: signedUrl, alt: name }]}
            initialIndex={0}
            onClose={() => setLightboxOpen(false)}
          />,
          document.body
        )}
      </>
    );
  }

  return (
    <div 
      className={`flex items-center gap-3 p-3 rounded-lg ${
        isOwn ? 'bg-primary-foreground/10' : 'bg-muted'
      } max-w-[220px] cursor-pointer hover:opacity-90 transition-opacity`}
      onClick={onDownload}
    >
      <div className={`p-2 rounded-lg ${isOwn ? 'bg-primary-foreground/20' : 'bg-background'}`}>
        <FileText className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isOwn ? 'text-primary-foreground' : 'text-foreground'}`}>
          {name}
        </p>
        {size && (
          <p className={`text-xs ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
            {formatSize(size)}
          </p>
        )}
      </div>
      <Download className="h-4 w-4 flex-shrink-0 opacity-70" />
    </div>
  );
};
