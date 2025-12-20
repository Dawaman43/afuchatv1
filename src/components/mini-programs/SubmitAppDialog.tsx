import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Upload, 
  Smartphone, 
  Globe, 
  FileText, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { MiniAppImageUpload } from './MiniAppImageUpload';

interface SubmitAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categories = [
  { id: 'games', name: 'Games', icon: '🎮' },
  { id: 'services', name: 'Services', icon: '⚙️' },
  { id: 'shopping', name: 'Shopping', icon: '🛒' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
  { id: 'utilities', name: 'Utilities', icon: '🔧' },
  { id: 'social', name: 'Social', icon: '💬' },
  { id: 'education', name: 'Education', icon: '📚' },
  { id: 'finance', name: 'Finance', icon: '💰' },
];

export const SubmitAppDialog = ({ open, onOpenChange }: SubmitAppDialogProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    url: '',
    iconUrl: '',
    screenshots: [] as string[],
    features: '',
    contactEmail: '',
    agreeTerms: false,
    agreeGuidelines: false,
  });

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addScreenshot = (url: string) => {
    if (url && formData.screenshots.length < 5) {
      setFormData(prev => ({ 
        ...prev, 
        screenshots: [...prev.screenshots, url] 
      }));
    }
  };

  const removeScreenshot = (index: number) => {
    setFormData(prev => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, i) => i !== index)
    }));
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      toast.error('App name is required');
      return false;
    }
    if (formData.name.length < 3 || formData.name.length > 50) {
      toast.error('App name must be 3-50 characters');
      return false;
    }
    if (!formData.description.trim()) {
      toast.error('Description is required');
      return false;
    }
    if (formData.description.length < 20) {
      toast.error('Description must be at least 20 characters');
      return false;
    }
    if (!formData.category) {
      toast.error('Please select a category');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.url.trim()) {
      toast.error('App URL is required');
      return false;
    }
    try {
      new URL(formData.url);
    } catch {
      toast.error('Please enter a valid URL');
      return false;
    }
    if (!formData.iconUrl.trim()) {
      toast.error('App icon is required');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.contactEmail.trim()) {
      toast.error('Contact email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.contactEmail)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (!formData.agreeTerms) {
      toast.error('You must agree to the Terms of Service');
      return false;
    }
    if (!formData.agreeGuidelines) {
      toast.error('You must agree to follow the App Guidelines');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;
    if (!user) {
      toast.error('Please sign in to submit an app');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('mini_programs')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim(),
          category: formData.category,
          url: formData.url.trim(),
          icon_url: formData.iconUrl.trim(),
          screenshots: formData.screenshots,
          features: formData.features.trim() || null,
          developer_id: user.id,
          developer_email: formData.contactEmail.trim(),
          status: 'pending',
          is_published: false,
        });

      if (error) throw error;

      toast.success('App submitted successfully! Our team will review it within 24-48 hours.');
      onOpenChange(false);
      setStep(1);
      setFormData({
        name: '',
        description: '',
        category: '',
        url: '',
        iconUrl: '',
        screenshots: [],
        features: '',
        contactEmail: '',
        agreeTerms: false,
        agreeGuidelines: false,
      });
    } catch (error: any) {
      console.error('Error submitting app:', error);
      toast.error(error.message || 'Failed to submit app. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
            s === step 
              ? 'bg-primary text-primary-foreground' 
              : s < step 
                ? 'bg-primary/20 text-primary' 
                : 'bg-muted text-muted-foreground'
          }`}>
            {s < step ? <CheckCircle2 className="h-4 w-4" /> : s}
          </div>
          {s < 3 && (
            <div className={`w-8 h-0.5 mx-1 ${s < step ? 'bg-primary' : 'bg-muted'}`} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4 max-h-[90vh] p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Submit Your App
          </DialogTitle>
          <DialogDescription>
            {step === 1 && 'Tell us about your app'}
            {step === 2 && 'Upload app assets'}
            {step === 3 && 'Review and submit'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-4 pt-2">
            <StepIndicator />

            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    App Name *
                  </Label>
                  <Input
                    id="name"
                    placeholder="My Awesome App"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    maxLength={50}
                  />
                  <p className="text-xs text-muted-foreground">{formData.name.length}/50 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Description *
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what your app does and why users will love it..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground">{formData.description.length}/500 characters</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Category *
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleInputChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <span className="flex items-center gap-2">
                            <span>{cat.icon}</span>
                            <span>{cat.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 2: Assets & Links */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p><strong>📱 Your app will open inside AfuChat</strong></p>
                      <p>Host your app on any web hosting service and provide the URL.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="url" className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    App URL *
                  </Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://myapp.example.com"
                    value={formData.url}
                    onChange={(e) => handleInputChange('url', e.target.value)}
                  />
                </div>

                {/* Icon Upload */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">App Icon *</Label>
                  <div className="flex items-center gap-4">
                    <MiniAppImageUpload
                      type="icon"
                      currentImage={formData.iconUrl}
                      onUploadComplete={(url) => handleInputChange('iconUrl', url)}
                    />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Upload a 512x512 PNG icon for your app</p>
                    </div>
                  </div>
                </div>

                {/* Screenshots Upload */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Screenshots (optional)</Label>
                  <p className="text-xs text-muted-foreground mb-2">Add up to 5 screenshots to showcase your app</p>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {formData.screenshots.map((screenshot, index) => (
                      <div key={index} className="relative aspect-video rounded-lg overflow-hidden border border-border">
                        <img 
                          src={screenshot} 
                          alt={`Screenshot ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-5 w-5"
                          onClick={() => removeScreenshot(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {formData.screenshots.length < 5 && (
                      <MiniAppImageUpload
                        type="screenshot"
                        onUploadComplete={addScreenshot}
                        className="aspect-video"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="features">Key Features (optional)</Label>
                  <Textarea
                    id="features"
                    placeholder="• Feature 1&#10;• Feature 2&#10;• Feature 3"
                    value={formData.features}
                    onChange={(e) => handleInputChange('features', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Review & Submit */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="bg-card border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-sm">App Summary</h4>
                  <div className="flex items-center gap-3">
                    {formData.iconUrl && (
                      <img 
                        src={formData.iconUrl} 
                        alt={formData.name}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium">{formData.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {categories.find(c => c.id === formData.category)?.name}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{formData.description}</p>
                  {formData.screenshots.length > 0 && (
                    <p className="text-xs text-muted-foreground">{formData.screenshots.length} screenshot(s) uploaded</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="developer@example.com"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">We'll contact you about your submission</p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms"
                      checked={formData.agreeTerms}
                      onCheckedChange={(checked) => handleInputChange('agreeTerms', checked as boolean)}
                    />
                    <label htmlFor="terms" className="text-sm cursor-pointer leading-tight">
                      I agree to the <span className="text-primary">Terms of Service</span> and <span className="text-primary">Privacy Policy</span>
                    </label>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="guidelines"
                      checked={formData.agreeGuidelines}
                      onCheckedChange={(checked) => handleInputChange('agreeGuidelines', checked as boolean)}
                    />
                    <label htmlFor="guidelines" className="text-sm cursor-pointer leading-tight">
                      My app follows the <span className="text-primary">AfuChat App Guidelines</span>
                    </label>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-3 mt-4">
                  <p className="text-xs text-muted-foreground text-center">
                    📱 Your app will be reviewed within <strong>24-48 hours</strong>
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="p-4 pt-2 gap-2 sm:gap-0 border-t">
          {step > 1 && (
            <Button variant="outline" onClick={handleBack} className="flex-1">
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={handleNext} className="flex-1">
              Continue
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Submit App
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
