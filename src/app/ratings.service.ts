import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { getFirestore, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { firebaseApp } from './firebase.config';
import { UserRatings, emptyUserRatings } from './rating.types';

const COLLECTION = 'my-rater-collection';

@Injectable({ providedIn: 'root' })
export class RatingsService {
  private readonly platformId = inject(PLATFORM_ID);

  private get db() {
    return getFirestore(firebaseApp);
  }

  /** Write one rating document to my-rater-collection */
  async saveRating(
    userName: string,
    rate: 'High' | 'Medium' | 'Low',
    rateText: string,
  ): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    await addDoc(collection(this.db, COLLECTION), {
      'user-name': userName,
      'rate': rate,
      'rate-text': rateText,
    });
  }

  /** Read all documents from my-rater-collection for a given user and aggregate them */
  async loadMyRatings(userName: string): Promise<UserRatings> {
    if (!isPlatformBrowser(this.platformId)) return emptyUserRatings();
    try {
      const q = query(
        collection(this.db, COLLECTION),
        where('user-name', '==', userName),
      );
      const snap = await getDocs(q);
      const ratings = emptyUserRatings();
      snap.forEach(d => {
        const rate = d.data()['rate'] as 'High' | 'Medium' | 'Low';
        const text = d.data()['rate-text'] as string;
        if (rate && rate in ratings) {
          ratings[rate].count++;
          ratings[rate].texts.push(text);
        }
      });
      return ratings;
    } catch {
      return emptyUserRatings();
    }
  }

  /** Read every document and aggregate by user-name */
  async loadAllUsersRatings(): Promise<Record<string, UserRatings>> {
    if (!isPlatformBrowser(this.platformId)) return {};
    try {
      const snap = await getDocs(collection(this.db, COLLECTION));
      const result: Record<string, UserRatings> = {};
      snap.forEach(d => {
        const userName = d.data()['user-name'] as string;
        const rate = d.data()['rate'] as 'High' | 'Medium' | 'Low';
        const text = d.data()['rate-text'] as string;
        if (!userName || !rate) return;
        if (!result[userName]) result[userName] = emptyUserRatings();
        if (rate in result[userName]) {
          result[userName][rate].count++;
          result[userName][rate].texts.push(text);
        }
      });
      return result;
    } catch {
      return {};
    }
  }
}
