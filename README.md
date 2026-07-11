# JurisTrail

**Case Memory & Investigation Assistant**

JurisTrail helps lawyers manage and analyze evidence for litigation cases. Upload PDF evidence documents - witness statements, phone records, GPS logs, financial records - and three AI agents automatically extract structured evidence, build chronological timelines, and identify contradictions, corroborations, and investigative leads. Then chat with your case knowledge in natural language and get citation-backed answers.

## Project Structure

This repository is a monorepo containing both the frontend client and the backend API:

- `/frontend` - The user interface.
- `/backend` - The REST API.

---

## Key Features

### 3-Agent AI Investigation Pipeline (Asynchronous)
When a PDF document is uploaded, it automatically triggers a background multi-agent processing pipeline:
1. **Evidence Agent:** Extracts structured facts, entities (witnesses, organizations, locations), relationships, dates, and claims. Large documents are split into overlapping chunks (~15,000 chars) to prevent context window overflow.
2. **Timeline Agent:** Gathers all accumulated evidence across all documents, resolves chronologies, formats display timestamps, determines precision levels (Exact, Approximate, GPS, etc.), and identifies chronological discrepancies.
3. **Investigation Agent:** Evaluates all evidence, timelines, and prior findings to detect contradictions, corroborations, informational gaps, behavior patterns, and generates actionable investigative leads.

### Frontend Features
- **Interactive Workspace Dashboard:** Seamlessly navigate between different views (Evidence, Timeline, Investigations, Chat) in a tabbed workspace.
- **Evidence Management (FactBox & Upload):** Drag-and-drop PDF upload zone with real-time processing status (Pending, Processing, Completed, Failed). Browse parsed evidence, extracted entities, and factual assertions per document.
- **Chronological Case Timeline:** Interactive visual timeline charting events with precision badges and support/conflict status indicators linking back to source documents.
- **Conflicts & Insights Board:** An analysis interface displaying contradictions, corroborations, gaps, patterns, and leads. Features side-by-side evidence comparison boxes highlighting conflicts between source documents.
- **Interactive Chat Assistant:** Secure, citation-backed AI assistant to query case files in natural language. Answers cite specific evidence IDs, timeline events, and documents.

### Backend Features
- **Semantic Memory Integration (RAG):** Integrates with a **Hindsight** memory bank client to store, recall, and reflect on case evidence using vectorized semantic embeddings.
- **Robust PDF Processing:** Parses raw text from multi-page PDF documents and validates format integrity.
- **Asynchronous Execution:** Background workers handle heavy AI agent tasks, ensuring the web client remains fast and responsive.

---

## Security & Privacy Practices

- **Data Encryption at Rest:** Sensitive litigation details, timelines, and investigation findings are encrypted at rest in the PostgreSQL database using **AES-256-GCM** symmetric encryption (with key derivation using `scrypt`).
- **Short-Lived Access Tokens:** Employs JWT access tokens (15-minute expiration) paired with database-backed session management. Access tokens are stored in secure, `httpOnly`, `sameSite` cookies to prevent Cross-Site Scripting (XSS) and session hijacking.
- **Secure Session Auto-Renewal:** If an access token expires while the database session remains active, the server dynamically generates and sets a new access token seamlessly.
- **Strict Authorization Checks:** Verifies user ownership on every API endpoint, ensuring cases, documents, timelines, and chats can only be accessed by the user who created them.
- **Brute-Force & Denial-of-Service Protection:** Integrated API rate-limiters (general endpoints limited to 200 req/15 min; auth routes limited to 15 req/15 min) to prevent denial-of-service and credential guessing.

---

## Technologies Used

### Frontend
- **React** (v19) - UI library for building the interactive dashboard and components.
- **Vite** - Next-generation frontend tooling for fast development.
- **Tailwind CSS** (v4) - Utility-first CSS framework for rapid, responsive, and modern styling.

### Backend
- **Node.js & Express** - Fast, unopinionated, and scalable web server framework.
- **PostgreSQL** (`pg`) - Robust relational database for reliable data storage.
- **OpenAI API** - AI integration for smart case analysis and assistance.
- **Cloudinary & Multer** - For secure file handling, storage, and image uploads.
- **PDF-Parse** - To extract and process text from uploaded case documents/evidence.
- **JWT & Bcrypt** - For secure user authentication, session management, and password hashing.

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [PostgreSQL](https://www.postgresql.org/)
- Cloudinary Account (for file storage)
- OpenAI API Key

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Copy `.env.example` to `.env` and fill in your configuration details (Database URL, JWT Secret, OpenAI API Key, Cloudinary credentials, etc.).
   ```bash
   cp .env.example .env
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory (in a new terminal):
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Copy `.env.example` to `.env` and configure your API URL.
   ```bash
   cp .env.example .env
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173` (default Vite port), and the backend will run on the port specified in your `.env` file.
