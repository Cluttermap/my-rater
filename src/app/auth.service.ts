import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { firebaseApp } from './firebase.config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);

  // undefined = still loading, null = not signed in, User = signed in
  readonly currentUser = signal<User | null | undefined>(undefined);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const auth = getAuth(firebaseApp);
      onAuthStateChanged(auth, user => {
        this.currentUser.set(user);
      });
    } else {
      this.currentUser.set(null);
    }
  }

  async signInWithGoogle(): Promise<void> {
    const auth = getAuth(firebaseApp);
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }

  async signOut(): Promise<void> {
    const auth = getAuth(firebaseApp);
    await signOut(auth);
  }
}
