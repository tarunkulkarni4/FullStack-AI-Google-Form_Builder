# <img src="screenshots/logo.png" width="40" height="40" align="center" /> NexForm - AI-Powered Google Form Builder

## Application Preview

<div align="center">
  <img src="screenshots/photo1.png" width="100%" />
</div>

<details>
<summary align="center"><b>🔍 Click here to view the full step-by-step workflow (Steps 2-10)</b></summary>

<br>

<!-- Slide 2 -->
<div align="center">
  <a name="photo2"></a>
  <a href="#photo1">⬅️ Previous</a> &nbsp;&nbsp;&nbsp;&nbsp; <b>Step 2 / 10</b> &nbsp;&nbsp;&nbsp;&nbsp; <a href="#photo3">Next ➡️</a>
  <br><br>
  <img src="screenshots/photo2.png" width="100%" />
</div>

<br>

<!-- Slide 3 -->
<div align="center">
  <a name="photo3"></a>
  <a href="#photo2">⬅️ Previous</a> &nbsp;&nbsp;&nbsp;&nbsp; <b>Step 3 / 10</b> &nbsp;&nbsp;&nbsp;&nbsp; <a href="#photo4">Next ➡️</a>
  <br><br>
  <img src="screenshots/photo3.png" width="100%" />
</div>

<br>

<!-- Slide 4 -->
<div align="center">
  <a name="photo4"></a>
  <a href="#photo3">⬅️ Previous</a> &nbsp;&nbsp;&nbsp;&nbsp; <b>Step 4 / 10</b> &nbsp;&nbsp;&nbsp;&nbsp; <a href="#photo5">Next ➡️</a>
  <br><br>
  <img src="screenshots/photo4.png" width="100%" />
</div>

<br>

<!-- Slide 5 -->
<div align="center">
  <a name="photo5"></a>
  <a href="#photo4">⬅️ Previous</a> &nbsp;&nbsp;&nbsp;&nbsp; <b>Step 5 / 10</b> &nbsp;&nbsp;&nbsp;&nbsp; <a href="#photo6">Next ➡️</a>
  <br><br>
  <img src="screenshots/photo5.png" width="100%" />
</div>

<br>

<!-- Slide 6 -->
<div align="center">
  <a name="photo6"></a>
  <a href="#photo5">⬅️ Previous</a> &nbsp;&nbsp;&nbsp;&nbsp; <b>Step 6 / 10</b> &nbsp;&nbsp;&nbsp;&nbsp; <a href="#photo7">Next ➡️</a>
  <br><br>
  <img src="screenshots/photo6.png" width="100%" />
</div>

<br>

<!-- Slide 7 -->
<div align="center">
  <a name="photo7"></a>
  <a href="#photo6">⬅️ Previous</a> &nbsp;&nbsp;&nbsp;&nbsp; <b>Step 7 / 10</b> &nbsp;&nbsp;&nbsp;&nbsp; <a href="#photo8">Next ➡️</a>
  <br><br>
  <img src="screenshots/photo7.png" width="100%" />
</div>

<br>

<!-- Slide 8 -->
<div align="center">
  <a name="photo8"></a>
  <a href="#photo7">⬅️ Previous</a> &nbsp;&nbsp;&nbsp;&nbsp; <b>Step 8 / 10</b> &nbsp;&nbsp;&nbsp;&nbsp; <a href="#photo9">Next ➡️</a>
  <br><br>
  <img src="screenshots/photo8.png" width="100%" />
</div>

<br>

<!-- Slide 9 -->
<div align="center">
  <a name="photo9"></a>
  <a href="#photo8">⬅️ Previous</a> &nbsp;&nbsp;&nbsp;&nbsp; <b>Step 9 / 10</b> &nbsp;&nbsp;&nbsp;&nbsp; <a href="#photo10">Next ➡️</a>
  <br><br>
  <img src="screenshots/photo9.png" width="100%" />
</div>

<br>

<!-- Slide 10 -->
<div align="center">
  <a name="photo10"></a>
  <a href="#photo9">⬅️ Previous</a> &nbsp;&nbsp;&nbsp;&nbsp; <b>Step 10 / 10</b> &nbsp;&nbsp;&nbsp;&nbsp; <a href="#photo1">Next ➡️</a>
  <br><br>
  <img src="screenshots/photo10.png" width="100%" />
</div>

</details>


<br>

---

<br>

## **Existing System**
Traditionally, creating Google Forms is a manual process. Users must manually type each question, choose the question type (multiple choice, checkbox, etc.), and arrange them. For complex surveys or long forms, this is time-consuming and prone to human error. There's no built-in intelligence to suggest questions or structures based on the form's purpose.

## **Proposed System**
**NexForm** is a high-end, full-stack AI-powered platform that revolutionizes Google Form creation. By leveraging a **Multi-Model AI Router**, users can generate complete, professional forms from simple natural language prompts. NexForm doesn't just create forms; it intelligently suggests structures, handles complex logic, and provides an **AI Expansion** engine to grow existing forms. With direct **Google Forms API** integration and a sophisticated **Smart Link** system, NexForm provides a production-grade experience for automated data collection.

## System Architecture
```mermaid
graph TD
    subgraph "Frontend (Client)"
        React[React 18 / Vite]
        UI[Tailwind CSS / Framer Motion]
        Icons[Lucide / Phosphor]
    end

    subgraph "Backend (Server)"
        Express[Express.js / Node]
        Router[Multi-Model AI Router]
        Auth[Google OAuth 2.0 / JWT]
    end

    subgraph "Database"
        Mongo[(MongoDB / Mongoose)]
    end

    subgraph "AI Ecosystem"
        direction TB
        Gemini[Gemini 1.5 Flash]
        GPT[GPT-4o]
        Claude[Claude 3.5 Sonnet]
        Llama[Llama 3.3 / Groq]
        DeepSeek[DeepSeek Coder]
        Mistral[Mistral Large]
    end

    subgraph "External Services"
        GForms[Google Forms API]
        GDrive[Google Drive API]
    end
    
    React <--> Express
    Express <--> Mongo
    Express <--> Router
    Router <--> Gemini
    Router <--> GPT
    Router <--> Claude
    Router <--> Llama
    Router <--> DeepSeek
    Router <--> Mistral
    Express <--> GForms
    Express <--> GDrive
    React <--> Auth
```

## Operational Flow
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant AI as AI Router
    participant G as Google Forms
    
    Note over U, G: AI Form Generation Lifecycle
    U->>F: Enter Natural Language Prompt
    F->>B: POST /api/forms/generate-ai
    B->>AI: Analyze Intent (Gemini/Llama/GPT)
    AI-->>B: Return Sections & Logic
    B-->>F: Suggest Structure
    U->>F: Confirm / Refine Sections
    F->>B: POST /api/forms/generate-structure
    B->>AI: Build Full Questions & Theme
    AI-->>B: Return Questions JSON
    B->>G: Create Form (Forms API)
    G-->>B: Form ID & Public Links
    B-->>F: Success (Smart Link Generated)
    
    Note over U, G: AI Expansion Lifecycle
    U->>F: Request AI Expansion
    F->>B: GET /api/forms/expand-suggestions
    B->>AI: Analyze Context
    AI-->>B: Suggest 4 Additions
    B-->>F: Show Expansion Marquee
```

## Key Features
- 🤖 **Multi-Model Intelligence**: Harness the power of Gemini 1.5, GPT-4o, Claude 3.5, and Llama 3 via a unified router.
- 🔄 **Intelligent Fallback**: Automatic routing to backup AI models if a provider experiences downtime.
- 📈 **AI Form Expansion**: Context-aware question generation to grow and refine existing forms.
- 🔗 **Smart Link System**: Manage form access with expiry dates, response limits, and custom status toggles.
- 🎨 **Dynamic Theming**: AI-generated color palettes and layouts that match your form's intent.
- 🔐 **OAuth 2.0 Security**: Secure, scoped access to Google Drive and Forms without storing sensitive passwords.
- 📱 **Premium Aesthetics**: A responsive, glassmorphic UI with smooth Framer Motion transitions.
- 📂 **Template Engine**: Pre-designed blueprints for surveys, registrations, and feedback forms.

## Environment Configuration

To run this project, you will need to set up environment variables. Create a `.env` file in the `server` directory and add the following:

### Server & Database
- `PORT`: Port for the backend server (e.g., `5000`).
- `MONGODB_URI`: Your MongoDB connection string.
- `NODE_ENV`: Set to `development` or `production`.

### Authentication (JWT & Google OAuth)
- `JWT_SECRET`: A secure random string for token encryption.
- `GOOGLE_CLIENT_ID`: Google Cloud Console OAuth Client ID.
- `GOOGLE_CLIENT_SECRET`: Google Cloud Console OAuth Client Secret.
- `GOOGLE_CALLBACK_URL`: `http://localhost:5000/api/auth/google/callback` (for local development).

### AI Services (Multi-Model)
- `GROQ_API_KEY`: Your Groq Cloud API Key (Llama 3).
- `GEMINI_API_KEY`: Google AI Studio API Key (Gemini 1.5).
- `OPENAI_API_KEY`: OpenAI API Key (GPT-4o).
- `ANTHROPIC_API_KEY`: Anthropic API Key (Claude 3.5).
- `DEEPSEEK_API_KEY`: DeepSeek API Key.
- `MISTRAL_API_KEY`: Mistral AI API Key.

### Frontend
- `CLIENT_URL`: `http://localhost:5173` (default for Vite).

## Setup Instructions
1. Clone the repository.
2. Install dependencies in both `client` and `server` folders using `npm install`.
3. Set up environment variables based on `.env.example`.
4. Run `npm run dev` in the client and `npm start` in the server.
