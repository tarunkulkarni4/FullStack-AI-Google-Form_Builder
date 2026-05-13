# NexForm - AI-Powered Google Form Builder

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
