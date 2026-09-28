// Firebase web config (public by design; access is controlled by Firestore rules)
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyC1dt2bSFLTNqFNE0bfak2y_nUs6AhUbyk",
  authDomain: "plex-reels-lab.firebaseapp.com",
  projectId: "plex-reels-lab",
  storageBucket: "plex-reels-lab.firebasestorage.app",
  messagingSenderId: "734251484638",
  appId: "1:734251484638:web:6ffb45ace17fe994d1494f"
};
// Only this Google account can edit reel scripts and statuses (enforced by Firestore rules too)
window.PLEX_OWNER_EMAIL = "vazha.ungiadze1@gmail.com";
