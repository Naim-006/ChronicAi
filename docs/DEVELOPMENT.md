# Developer Guide & Local Environment Setup — Universal Personal Medical AI

## 1. Prerequisites
- **Node.js**: v20+ (tested on Node.js v24.14.0)
- **Package Manager**: `npm` v10+ (tested on v11.9.0)
- **Supabase**: Cloud project or local Supabase CLI instance (`npx supabase start`)

---

## 2. Environment Variables
Create a `.env.local` file in the root directory:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Provider Configuration
AI_PROVIDER=gemini # options: gemini, openai, anthropic, mock
AI_API_KEY=your-ai-api-key
AI_MODEL=gemini-1.5-pro

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 3. Running Locally
```bash
# Install dependencies
npm install

# Start Next.js development server
npm run dev

# Run automated tests
npm run test

# Typecheck and lint
npm run lint
```

---

## 4. Code Quality & Conventions
- **TypeScript**: Strict type checking. Do not use `any`. Use discriminated unions for polymorphic clinical events.
- **Component Design**: Pure functional components with explicit interfaces. Feature-specific components reside in `src/features/[feature]/components/`.
- **Styling**: Tailwind utility classes adhering to the calm teal/slate design tokens. Avoid random hex codes; use design system variables.
