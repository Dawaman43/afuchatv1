import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import Logo from '@/components/Logo';
import { useTranslation } from 'react-i18next';
import { OwlAvatar } from '@/components/avatar/OwlAvatar';
import { useUserAvatar } from '@/hooks/useUserAvatar';
import { OwlAvatarConfig, AccessoryType, EmotionType } from '@/types/avatar';
import { ColorPicker } from '@/components/avatar/ColorPicker';
import { AccessorySelector } from '@/components/avatar/AccessorySelector';
import { EmotionSelector } from '@/components/avatar/EmotionSelector';
import { EyeSelector } from '@/components/avatar/EyeSelector';
import { BackgroundSelector } from '@/components/avatar/BackgroundSelector';

const AvatarEditor = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { avatarConfig: savedConfig, loading: loadingAvatar, updateAvatar } = useUserAvatar(user?.id);
  
  const [config, setConfig] = useState<OwlAvatarConfig>(savedConfig);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      toast.error('Please login to customize your avatar');
      navigate('/auth');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (savedConfig) {
      setConfig(savedConfig);
    }
  }, [savedConfig]);

  const handleColorChange = (color: string) => {
    setConfig(prev => ({ ...prev, color }));
  };

  const handleFeatherColorChange = (featherColor: string) => {
    setConfig(prev => ({ ...prev, featherColor }));
  };

  const handleAccessoryToggle = (accessory: AccessoryType) => {
    setConfig(prev => {
      const accessories = prev.accessories.includes(accessory)
        ? prev.accessories.filter(a => a !== accessory)
        : [...prev.accessories, accessory];
      return { ...prev, accessories };
    });
  };

  const handleEmotionChange = (emotion: EmotionType) => {
    setConfig(prev => ({ ...prev, emotion }));
  };

  const handleEyeChange = (eyes: 'normal' | 'sleepy' | 'wide') => {
    setConfig(prev => ({ ...prev, eyes }));
  };

  const handleBackgroundChange = (background: 'light' | 'gradient' | 'transparent') => {
    setConfig(prev => ({ ...prev, background }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await updateAvatar(config);
      if (success) {
        toast.success('Avatar saved successfully! 🦉');
        setTimeout(() => navigate(-1), 500);
      } else {
        toast.error('Failed to save avatar');
      }
    } catch (error) {
      console.error('Error saving avatar:', error);
      toast.error('Failed to save avatar');
    } finally {
      setSaving(false);
    }
  };

  if (loadingAvatar) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex h-14 sm:h-16 items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="absolute left-1/2 -translate-x-1/2">
              <Logo size="sm" />
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="shrink-0"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Customize Your Owl</h1>
            <p className="text-muted-foreground mt-1">Create your unique owl identity</p>
          </div>

          {/* Preview Card */}
          <Card className="p-6 sm:p-8">
            <div className="flex flex-col items-center gap-4">
              <h2 className="text-lg font-semibold">Preview</h2>
              <div className="p-4 rounded-lg bg-muted/30">
                <OwlAvatar config={config} size={200} />
              </div>
            </div>
          </Card>

          {/* Color Customization */}
          <Card className="p-4 sm:p-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Colors</h2>
              <Separator />
              <ColorPicker
                label="Body Color"
                color={config.color}
                onChange={handleColorChange}
              />
              <ColorPicker
                label="Feather Color (optional)"
                color={config.featherColor || ''}
                onChange={handleFeatherColorChange}
                optional
              />
            </div>
          </Card>

          {/* Accessories */}
          <Card className="p-4 sm:p-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Accessories</h2>
              <Separator />
              <AccessorySelector
                selectedAccessories={config.accessories}
                onToggle={handleAccessoryToggle}
              />
            </div>
          </Card>

          {/* Expression */}
          <Card className="p-4 sm:p-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Expression</h2>
              <Separator />
              <EmotionSelector
                selectedEmotion={config.emotion}
                onChange={handleEmotionChange}
              />
              <EyeSelector
                selectedEyes={config.eyes}
                onChange={handleEyeChange}
              />
            </div>
          </Card>

          {/* Background */}
          <Card className="p-4 sm:p-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Background</h2>
              <Separator />
              <BackgroundSelector
                selectedBackground={config.background}
                onChange={handleBackgroundChange}
              />
            </div>
          </Card>

          {/* Save Button (Mobile) */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full"
            size="lg"
          >
            <Save className="h-5 w-5 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default AvatarEditor;
