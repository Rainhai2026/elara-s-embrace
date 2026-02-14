# AI Rules & Project Guidelines

## Tech Stack
- **Framework**: React 18 with Vite for fast development and bundling.
- **Language**: TypeScript for type safety and better developer experience.
- **Styling**: Tailwind CSS for utility-first styling and responsive design.
- **UI Components**: shadcn/ui (built on Radix UI) for accessible, unstyled components.
- **Icons**: Lucide React for a consistent and lightweight icon set.
- **Routing**: React Router DOM (v6) for client-side navigation.
- **State Management & Data Fetching**: TanStack Query (React Query) for server state synchronization.
- **Backend & Auth**: Supabase for database, authentication, and edge functions.
- **Forms**: React Hook Form combined with Zod for schema-based validation.
- **Notifications**: Sonner for sleek, toast-style notifications.

## Library Usage Rules

### 1. UI & Styling
- **Tailwind CSS**: Use Tailwind classes for all styling. Avoid custom CSS files unless absolutely necessary for complex animations or third-party overrides.
- **shadcn/ui**: Always check if a component exists in `src/components/ui/` before building a new one. If you need to modify a shadcn component, create a wrapper or a new component in `src/components/` instead of editing the base UI file.
- **Lucide React**: Use this for all icons. Keep icon sizes consistent (usually `h-4 w-4` or `h-5 w-5`).

### 2. State & Data
- **TanStack Query**: Use `useQuery` for fetching data and `useMutation` for creating/updating/deleting. Do not use `useEffect` for data fetching.
- **Supabase**: Use the generated client in `src/integrations/supabase/client.ts` for all database interactions.
- **Local State**: Use standard React `useState` and `useReducer` for component-level state. For global UI state, consider a simple Context API or keeping it in the URL via React Router.

### 3. Forms & Validation
- **React Hook Form**: Use this for all form handling to ensure performance and easy integration with UI components.
- **Zod**: Define schemas for all forms and API responses to ensure data integrity.

### 4. Routing
- **React Router**: Keep all route definitions in `src/App.tsx`. Use the `NavLink` component for navigation links to handle active states automatically.

### 5. Code Structure
- **Components**: Keep components small and focused. If a component exceeds 100 lines, consider refactoring it into smaller sub-components.
- **Hooks**: Extract complex logic into custom hooks in `src/hooks/`.
- **Pages**: Keep page components in `src/pages/` and use them primarily for layout and data orchestration.

### 6. Error Handling & Feedback
- **Toasts**: Use `sonner` (via the `toast` function) to provide immediate feedback for user actions (success, error, loading).
- **Error Boundaries**: Ensure critical parts of the app are wrapped in error boundaries or have graceful fallbacks.