# NexForm - AI-Powered Google Form Builder

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

## Setup Instructions
1. Clone the repository.
2. Install dependencies in both `client` and `server` folders using `npm install`.
3. Set up environment variables based on `.env.example`.
4. Run `npm run dev` in the client and `npm start` in the server.
