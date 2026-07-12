// Firebase configuration for Google sign-in and cloud sync.
//
// The app works fully offline/local without this. To enable Google login
// and cross-device sync:
//
//   1. Go to https://console.firebase.google.com and create a project.
//   2. Add a Web App to the project and copy its config object.
//   3. In the console, enable Authentication > Sign-in method > Google.
//   4. Enable Firestore Database (production mode) and set these rules:
//
//        rules_version = '2';
//        service cloud.firestore {
//          match /databases/{database}/documents {
//            match /users/{userId} {
//              allow read, write: if request.auth != null && request.auth.uid == userId;
//            }
//          }
//        }
//
//   5. Add your deployed domain (and localhost) under
//      Authentication > Settings > Authorized domains.
//   6. Replace `null` below with your config object, e.g.:
//
//        export const firebaseConfig = {
//            apiKey: "AIza...",
//            authDomain: "your-project.firebaseapp.com",
//            projectId: "your-project",
//            storageBucket: "your-project.appspot.com",
//            messagingSenderId: "1234567890",
//            appId: "1:1234567890:web:abcdef"
//        };

export const firebaseConfig = null;
