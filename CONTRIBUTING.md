# Contributing to AfuChat

Thank you for your interest in contributing to AfuChat! This guide will help you get started.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works)
- Git

### Setting Up Your Development Environment

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/afuchat.git
   cd afuchat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up your own Supabase project**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Run the migrations from `supabase/migrations/` in your Supabase SQL editor
   - Copy your project URL and anon key

4. **Configure environment variables**
   
   Create or update the `.env` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
   VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
   VITE_SUPABASE_PROJECT_ID="YOUR_PROJECT_ID"
   ```

5. **Update the Supabase client**
   
   Update `src/integrations/supabase/client.ts` with your credentials for local development.

6. **Set up Edge Function secrets (optional)**
   
   If you're working on features that require external APIs, you'll need to add secrets to your Supabase project:
   - Go to your Supabase Dashboard → Settings → Edge Functions → Secrets
   - Add the required API keys (e.g., `OPENAI_API_KEY`, `GEMINI_API_KEY`, etc.)

7. **Start the development server**
   ```bash
   npm run dev
   ```

## Making Contributions

### Code Style

- Use TypeScript for all new code
- Follow the existing code patterns and naming conventions
- Use Tailwind CSS for styling with semantic tokens from the design system
- Keep components small and focused

### Pull Request Process

1. Create a new branch for your feature/fix
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit with clear messages
   ```bash
   git commit -m "feat: add new feature description"
   ```

3. Push to your fork and create a Pull Request

4. Ensure your PR:
   - Has a clear title and description
   - References any related issues
   - Passes all checks
   - Doesn't include any API keys or secrets

### Commit Message Convention

We follow conventional commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

## Project Structure

```
src/
├── components/     # React components
├── contexts/       # React contexts
├── hooks/          # Custom React hooks
├── integrations/   # Third-party integrations
├── lib/            # Utility functions
├── pages/          # Page components
└── i18n/           # Internationalization
supabase/
├── functions/      # Edge functions
└── migrations/     # Database migrations
```

## Need Help?

- Check existing issues for similar questions
- Open a new issue for bugs or feature requests
- Be respectful and constructive in discussions

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
