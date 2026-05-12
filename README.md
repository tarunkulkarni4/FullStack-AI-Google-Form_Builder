# NexForm - AI-Powered Google Form Builder

## Application Workflow

| Step | Description | Preview |
|:---:|---|---|
| 1 | **Landing Page**: A sleek, modern entry point for the NexForm platform. | ![Step 1](screenshots/photo1.png) |
| 2 | **Secure Authentication**: Seamless integration with Google OAuth 2.0 for secure access. | ![Step 2](screenshots/photo2.png) |
| 3 | **Dashboard**: Manage all your generated forms and view analytics in one place. | ![Step 3](screenshots/photo3.png) |
| 4 | **AI Prompting**: Describe your form requirements in natural language. | ![Step 4](screenshots/photo4.png) |
| 5 | **Schema Planning**: AI analyzes intent and plans the optimal field structure. | ![Step 5](screenshots/photo5.png) |
| 6 | **Instant Deployment**: Fully functional Google Forms created in seconds. | ![Step 6](screenshots/photo6.png) |
| 7 | **NexForm Pro**: Access advanced features like contextual form expansion. | ![Step 7](screenshots/photo7.png) |
| 8 | **Secure Billing**: Trusted payment processing powered by Stripe. | ![Step 8](screenshots/photo8.png) |
| 9 | **Contextual AI Expansion**: Add new questions to existing forms with deep context. | ![Step 9](screenshots/photo9.png) |
| 10 | **Billing History**: Comprehensive tracking of all subscription transactions. | ![Step 10](screenshots/photo10.png) |

## Explanation of Existing System
Traditionally, creating Google Forms is a manual process. Users must manually type each question, choose the question type (multiple choice, checkbox, etc.), and arrange them. For complex surveys or long forms, this is time-consuming and prone to human error. There's no built-in intelligence to suggest questions or structures based on the form's purpose.

## Proposed System
**NexForm** is a full-stack AI-powered application that automates Google Form creation. By simply providing a natural language prompt (e.g., "Create a registration form for a coding bootcamp"), NexForm uses high-performance AI models (Llama 3 via Groq API) to generate a complete form structure, including titles, descriptions, and optimized question types. It then integrates directly with the Google Forms API to create the form in the user's account.

## System Architecture
```mermaid
graph LR
    subgraph Frontend
        React[React / Vite]
        Tailwind[Tailwind CSS]
    end
    subgraph Backend
        Express[Express.js / Node]
        Mongoose[Mongoose / MongoDB]
    end
    subgraph "External Services"
        Groq[Groq AI / Llama 3]
        GoogleAPI[Google Forms API]
        Stripe[Stripe Payments]
        OAuth[Google OAuth 2.0]
    end
    
    React <--> Express
    Express <--> Mongoose
    Express <--> Groq
    Express <--> GoogleAPI
    Express <--> Stripe
    React <--> OAuth
```

## Operational Flow
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant AI as Groq AI
    participant G as Google Forms
    
    U->>F: Enter Prompt
    F->>B: POST /api/forms/generate
    B->>AI: Generate Schema (JSON)
    AI-->>B: Form Structure
    B->>G: Create Form (API)
    G-->>B: Form ID & URLs
    B-->>F: Success (Links)
    F-->>U: Show Preview / Edit Link
```

## Features
- 🚀 **AI Generation**: Generate complex forms in seconds from text prompts.
- 🔐 **Secure Auth**: Google OAuth integration for direct access to Google Drive/Forms.
- 📊 **Analytics**: Track form responses and performance.
- 💎 **Premium Tier**: Subscription model for unlimited form generation.
- 📱 **Responsive Design**: Modern UI built for both desktop and mobile.

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

### AI Service (Groq)
- `GROQ_API_KEY`: Your Groq Cloud API Key for AI form generation.

### Frontend
- `CLIENT_URL`: `http://localhost:5173` (default for Vite).

## Setup Instructions
1. Clone the repository.
2. Install dependencies in both `client` and `server` folders using `npm install`.
3. Set up environment variables based on `.env.example`.
4. Run `npm run dev` in the client and `npm start` in the server.
