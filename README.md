# antHR - Enterprise HR Platform

A complete HR management system built with React, Vite, Zustand, Tailwind CSS, and Firebase.

## Prerequisites
- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)
- Git

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd anthr
   ```

2. **Install Client Dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

3. **Install Functions Dependencies**
   ```bash
   cd functions
   npm install
   cd ..
   ```

## Firebase Project Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. Enable Authentication (Email/Password, Google).
3. Enable Firestore Database.
4. Enable Firebase Storage.
5. Upgrade to the Blaze (Pay as you go) plan if you intend to deploy Cloud Functions.
6. Initialize Firebase in your local environment if not already linked:
   ```bash
   firebase login
   firebase use --add
   ```
   Select your newly created project and set the alias to `default`.

## Environment Variable Setup

You need to configure the environment variables before running the application.

1. **Client Environment Variables**
   Navigate to the `client` directory and open `.env.production` (or create a `.env.local` for local development).
   ```env
   VITE_FIREBASE_API_KEY=your_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FUNCTIONS_URL=https://us-central1-your_project_id.cloudfunctions.net/api
   VITE_APP_NAME=antHR
   VITE_APP_ENV=production
   ```

2. **Functions Environment Variables**
   Navigate to the `functions` directory and open `.env.production`.
   ```env
   ANTHROPIC_API_KEY=your_key_here
   SENDGRID_API_KEY=your_key_here
   SENDGRID_FROM_EMAIL=noreply@anthr.app
   CLIENT_URL=https://your_project_id.web.app
   NODE_ENV=production
   ```

## Local Development with Emulators

To run the application locally without affecting your production database, use the Firebase Emulators.

1. Start the emulators from the root directory:
   ```bash
   npm run emulate
   ```
   This will spin up Auth (9099), Functions (5001), Firestore (8080), Storage (9199), and Hosting (5000).

2. In a separate terminal, start the Vite development server:
   ```bash
   npm run dev
   ```

## Production Deployment Steps

From the root directory, you can deploy the application using the NPM scripts provided.

1. **Deploy Only Hosting (Frontend)**
   ```bash
   npm run deploy:hosting
   ```

2. **Deploy Only Functions (Backend)**
   ```bash
   npm run deploy:functions
   ```

3. **Deploy Only Rules (Security)**
   ```bash
   npm run deploy:rules
   ```

4. **Deploy Everything**
   ```bash
   npm run deploy:all
   ```
