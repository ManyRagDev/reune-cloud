# Technology Stack

## Frontend Core
-   **Framework:** React 18 + Vite
-   **Language:** TypeScript (Strict Mode)
-   **Routing:** `react-router-dom`
-   **State Management:** `@tanstack/react-query` (Server State) + React Context (Local).

## UI & UX
-   **Component Library:** shadcn/ui (Radix UI based).
-   **Styling:** Tailwind CSS + `tailwindcss-animate`.
-   **Icons:** `lucide-react`.
-   **Animations:** `framer-motion` (used in Dashboard cards/transitions).
-   **Charts:** `recharts` (for financial summaries).
-   **Feedback:** `sonner` (Toasts).

## Backend & Data Layer
-   **BaaS:** Supabase.
-   **Data Access:** **Strictly via `src/api/rpc.ts`** (Abstraction layer over Supabase RPCs).
-   **Authentication:** Supabase Auth (`useAuth` hook).

## AI & Logic
-   **Orchestration:** Custom `simpleOrchestrate` or `chatOrchestrator` pattern.
-   **LLM Integration:** Edge Functions (`supabase/functions/llm-chat`).