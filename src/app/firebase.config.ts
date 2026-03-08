import { initializeApp } from 'firebase/app';

export const firebaseConfig = {
  apiKey: 'AIzaSyDIspiufWAIl1GYWSbdx-gAJY5K1unVqm0',
  authDomain: 'my-rater-firebase.firebaseapp.com',
  projectId: 'my-rater-firebase',
  storageBucket: 'my-rater-firebase.firebasestorage.app',
  messagingSenderId: '419282682899',
  appId: '1:419282682899:web:e84f8c00fc63fb61662be6',
  measurementId: 'G-6QGHBH7Q1J',
};

export const firebaseApp = initializeApp(firebaseConfig);
