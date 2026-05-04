# FoodieExpress - Food Ordering System

A full-stack food ordering mobile application built for a university group project. 

## Features
- **Member 1**: User Authentication (JWT) & Profile Management.
- **Member 2**: Restaurant Management (CRUD, Image uploads via Cloudinary).
- **Member 3**: Menu Management (CRUD, Category filtering).
- **Member 4**: Cart & Order System (Place orders, Track status).
- **Member 5**: Payment & Checkout Integration (Simulated Card/Cash).
- **Member 6**: Reviews & Ratings + Deployment Config.

## Tech Stack
- **Frontend**: React Native (Expo), NativeWind (Tailwind CSS).
- **Backend**: Node.js, Express, MongoDB (Mongoose).
- **Storage**: Cloudinary (Images), Multer.
- **Security**: JWT, bcryptjs.

---

## Setup Instructions

### 1. Backend Setup
1. Navigate to the `backend` folder.
2. Run `npm install`.
3. Create a `.env` file based on `.env.example` and add your credentials.
4. Run `npm run dev` to start the development server.

### 2. Frontend Setup
1. Navigate to the `frontend` folder.
2. Run `npm install`.
3. Create a `.env` file based on `.env.example`. 
   - **IMPORTANT**: Use your machine's **local IP address** (e.g., `http://192.168.1.5:5000/api`) instead of `localhost` if testing on a physical device.
4. Run `npx expo start` to run the app.

---

## Deployment & APK Generation

### Backend Deployment
1. Push the `backend` folder to a GitHub repository.
2. Deploy to **Render** or **Railway**.
3. Add all `.env` variables to the platform's Environment Settings.

### Mobile APK Generation (EAS Build)
1. Install EAS CLI: `npm install -g eas-cli`.
2. Login to Expo: `eas login`.
3. Initialize EAS: `eas build:configure`.
4. Build APK: `eas build -p android --profile preview`.
5. Download the `.apk` from the provided link.

---

## Project Structure
- `backend/`: Server logic, models, controllers, and routes.
- `frontend/`: Expo mobile app src code, context, and screens.
- `frontend/src/screens/`: 13 distinct screens for the full user journey.
