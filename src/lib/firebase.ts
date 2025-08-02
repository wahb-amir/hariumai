
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";

let app: FirebaseApp;
let auth: Auth;

if (typeof window !== 'undefined') {
    const firebaseConfig = {
      apiKey: "AIzaSyC5qgRXT3sFCYqp23VhByLC-CjmlqsxkOY",
      authDomain: "new-prototype-4j15w.firebaseapp.com",
      databaseURL: "https://new-prototype-4j15w-default-rtdb.firebaseio.com",
      projectId: "new-prototype-4j15w",
      storageBucket: "new-prototype-4j15w.firebasestorage.app",
      messagingSenderId: "1048797164176",
      appId: "1:1048797164176:web:ef96f32a3a905351cc1e15"
    };
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
}

// @ts-ignore
export { app, auth };
