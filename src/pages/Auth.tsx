import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthSheet from '@/components/ui/AuthSheet'; // Adjust path if necessary

/**
 * Auth Component
 * * This component acts as a dedicated route handler for the '/auth' path.
 * It renders the AuthSheet component immediately upon navigation.
 */
const Auth = () => {
    // We use a state to control the sheet's visibility.
    // It starts open when the user hits this route.
    const [isOpen, setIsOpen] = useState(true);
    const navigate = useNavigate();

    /**
     * Handles the closing of the sheet.
     * When the user successfully signs in/up, the sheet calls onClose(),
     * which triggers this handler to close the sheet and redirect them home.
     * * @param open - The new state of the dialog (true = open, false = closed).
     */
    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        
        // If the sheet is closing (and assuming successful auth), redirect the user home.
        if (!open) {
            navigate('/');
        }
    };

    return (
        // The background wrapper provides a full-screen, simple context for the sheet.
        <div className="min-h-screen flex items-center justify-center bg-background/50 p-4">
            <AuthSheet 
                isOpen={isOpen} 
                onOpenChange={handleOpenChange} 
            />
        </div>
    );
};

export default Auth;
