import { Component, inject, PLATFORM_ID, signal, effect, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass, isPlatformBrowser } from '@angular/common';
import { AuthService } from './auth.service';
import { AudioService } from './audio.service';
import { RatingsService } from './ratings.service';
import { UserRatings } from './rating.types';
import { ONBOARDING_QUESTIONS, ONBOARDING_SUMMARY_TEXTS } from './onboarding-questions';
import { SOCIAL_PLATFORMS } from './social-platforms';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule, NgClass],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly auth = inject(AuthService);
  private readonly ratingsService = inject(RatingsService);
  private readonly _audio = inject(AudioService);

  // Onboarding
  protected onboardingDone = signal<boolean | null>(null);
  protected onboardingStep = signal(0);
  protected onboardingAnswers = signal<Record<string, string>>({});
  protected onboardingShowSummary = signal(false);
  protected onboardingSummaryText = signal('');
  protected onboardingTyped = signal('');
  protected onboardingTypingDone = signal(false);
  protected readonly onboardingQuestions = ONBOARDING_QUESTIONS;

  // Welcome screen (shown once after onboarding)
  protected showWelcome = signal(false);
  protected welcomeStep = signal(-1);
  protected readonly welcomeSentences = [
    'Welcome to Share Rater.',
    'We rate your shit first.',
    'Low, Medium, or High.',
    'Low? Don’t share shit.',
  ];

  // Rating
  protected inputText = signal('');
  protected inputMode = signal<'social' | 'text' | 'url'>('social');
  protected selectedSocial = signal<string | null>(null);
  protected readonly socialPlatforms = SOCIAL_PLATFORMS;
  protected isLoading = signal(false);
  protected rate = signal<'High' | 'Medium' | 'Low' | null>(null);
  protected rateExplanation = signal<string | null>(null);
  protected errorMessage = signal<string | null>(null);
  protected activeTab = signal<'rate' | 'results'>('rate');
  protected allUsersRatings = signal<Record<string, UserRatings>>({});
  protected readonly allUsersList = computed(() =>
    Object.entries(this.allUsersRatings()).map(([name, ratings], i) => ({
      name,
      ratings,
      avatar: this.userAvatars[i % this.userAvatars.length],
    }))
  );
  private readonly userAvatars = [
    '😀', '😎', '🤩', '😜', '🥳', '😏', '🤓', '🧐',
    '😈', '🤑', '🤣', '😇', '😺', '😸', '🤠', '👽',
    '🤖', '👻', '🐸', '🥸', '😍', '🤪', '😋', '🫠',
  ];

  private readonly rateExplanations = {
    Low: [
      'I fell asleep twice while scrolling past the title',
      'my goldfish has more interesting thoughts than this',
      'whoever wrote this clearly had a deadline and zero ideas',
      "I've seen more original content on a shampoo bottle",
      'reading this actually made me dumber, measurably',
      "this is what happens when someone's keyboard has autocomplete and no brain",
      'I would rather watch paint dry, at least that has suspense',
      "the author confused 'having opinions' with 'having a point'",
      'needs AI summary because even AI would struggle to care',
      "I clicked this by accident and I'm still not over it",
      'my therapist will be hearing about this',
      'three paragraphs to say absolutely nothing, impressive in a bad way',
      "this content is so dry it's a fire hazard",
    ],
    Medium: [
      'fine, I guess, like lukewarm soup',
      "won't change your life but won't ruin it either",
      'the beige wallpaper of internet content',
      'solid 5/10, would not remember in 10 minutes',
      'exists, which is more than I can say for some things',
      "it's there and it has words and some of them are in the right order",
      'the content equivalent of a firm handshake from a stranger',
    ],
    High: [
      'actually worth the 3 minutes of my finite existence',
      'I sent this to my mum and she almost understood it',
      'rare W, the algorithm did something right for once',
      "bookmark-worthy, and I never bookmark anything",
      'I read it twice, voluntarily, without anyone watching',
      'this restored a small but meaningful piece of my faith in the internet',
      "genuinely good, and I don't say that lightly because I say it never",
    ]
  };

  constructor() {
    // When user signs in: check onboarding + load ratings from Firestore
    effect(() => {
      const user = this.auth.currentUser();
      if (user && isPlatformBrowser(this.platformId)) {
        // Onboarding check
        const key = `onboarding_done_${user.uid}`;
        if (localStorage.getItem(key)) {
          this.onboardingDone.set(true);
        } else {
          this.onboardingDone.set(false);
          this.onboardingStep.set(0);
          this.onboardingAnswers.set({});
        }
        // Load all users' ratings
        this.ratingsService.loadAllUsersRatings().then(r => this.allUsersRatings.set(r));
      }
    });
  }

  protected totalRatingsFor(name: string): number {
    const r = this.allUsersRatings()[name];
    return r ? r.High.count + r.Medium.count + r.Low.count : 0;
  }

  // ── Onboarding ──────────────────────────────────────────────────────────────

  protected currentIntro(): string | null {
    const q = ONBOARDING_QUESTIONS[this.onboardingStep()];
    if (!q?.intro) return null;
    const answers = this.onboardingAnswers();
    return typeof q.intro === 'function' ? q.intro(answers) : q.intro;
  }

  protected retakeOnboarding(): void {
    const user = this.auth.currentUser();
    if (user && isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(`onboarding_done_${user.uid}`);
    }
    this.onboardingAnswers.set({});
    this.onboardingStep.set(0);
    this.onboardingShowSummary.set(false);
    this.onboardingTyped.set('');
    this.onboardingTypingDone.set(false);
    this.showWelcome.set(false);
    this.onboardingDone.set(false);
  }

  protected answerQuestion(answer: string): void {
    const step = this.onboardingStep();
    const q = ONBOARDING_QUESTIONS[step];
    this.onboardingAnswers.update(a => ({ ...a, [q.id]: answer }));
    if (step + 1 >= ONBOARDING_QUESTIONS.length) {
      const randomText = ONBOARDING_SUMMARY_TEXTS[Math.floor(Math.random() * ONBOARDING_SUMMARY_TEXTS.length)];
      this.onboardingSummaryText.set(randomText);
      this.onboardingTyped.set('');
      this.onboardingTypingDone.set(false);
      this.onboardingShowSummary.set(true);
      setTimeout(() => this.startTypewriter(randomText), 600);
    } else {
      this.onboardingStep.set(step + 1);
    }
  }

  private startTypewriter(text: string): void {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      this.onboardingTyped.set(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        this.onboardingTypingDone.set(true);
      }
    }, 90);
  }

  protected finishOnboarding(): void {
    const user = this.auth.currentUser();
    if (user && isPlatformBrowser(this.platformId)) {
      localStorage.setItem(`onboarding_done_${user.uid}`, '1');
    }
    this.onboardingShowSummary.set(false);
    this.onboardingDone.set(true);
    this.welcomeStep.set(-1);
    this.showWelcome.set(true);
    // Pop in each sentence sequentially, then reveal button
    const total = this.welcomeSentences.length;
    for (let i = 0; i <= total; i++) {
      setTimeout(() => this.welcomeStep.set(i), 500 + i * 1500);
    }
  }

  protected finishWelcome(): void {
    this.showWelcome.set(false);
  }

  // ── Rating ───────────────────────────────────────────────────────────────────

  protected setInputMode(mode: 'social' | 'text' | 'url'): void {
    this.inputMode.set(mode);
    this.inputText.set('');
    this.selectedSocial.set(null);
    this.rate.set(null);
    this.rateExplanation.set(null);
    this.errorMessage.set(null);
  }

  protected selectSocial(platformName: string): void {
    this.selectedSocial.set(platformName);
    this.rate.set(null);
    this.rateExplanation.set(null);
    this.errorMessage.set(null);
  }

  protected setTab(tab: 'rate' | 'results'): void {
    this.activeTab.set(tab);
  }

  protected async getRate(): Promise<void> {
    const user = this.auth.currentUser();
    const effectiveText = this.inputMode() === 'social'
      ? this.selectedSocial()
      : this.inputText();
    if (!effectiveText || !user) return;

    this.isLoading.set(true);
    this.rate.set(null);
    this.rateExplanation.set(null);
    this.errorMessage.set(null);

    if (this.inputMode() === 'url') {
      if (!this.isValidUrl(this.inputText())) {
        this.errorMessage.set('Please enter a valid URL (e.g., https://example.com)');
        this.isLoading.set(false);
        return;
      }
      this.inputText.set(this.normalizeUrl(this.inputText()));
      if (!await this.checkUrlSafety(this.inputText())) {
        this.errorMessage.set("Sorry, that's not an appropriate website to get a Rate on.");
        this.isLoading.set(false);
        return;
      }
    }

    setTimeout(async () => {
      const rates: ('High' | 'Medium' | 'Low')[] = ['High', 'Medium', 'Low'];
      const selectedRate = rates[Math.floor(Math.random() * rates.length)];
      const explanations = this.rateExplanations[selectedRate];
      const selectedExplanation = explanations[Math.floor(Math.random() * explanations.length)];

      this.rate.set(selectedRate);
      this.rateExplanation.set(selectedExplanation);
      this.isLoading.set(false);

      // Optimistic local update
      const userName = user!.displayName ?? user!.uid;
      const all = this.allUsersRatings();
      const current = all[userName] ?? { High: { count: 0, texts: [] }, Medium: { count: 0, texts: [] }, Low: { count: 0, texts: [] } };
      this.allUsersRatings.set({
        ...all,
        [userName]: {
          ...current,
          [selectedRate]: {
            count: current[selectedRate].count + 1,
            texts: [...current[selectedRate].texts, selectedExplanation],
          },
        },
      });

      // Persist to Firestore
      await this.ratingsService.saveRating(
        user!.displayName ?? user!.uid,
        selectedRate,
        selectedExplanation,
      );
    }, 2000);
  }

  private normalizeUrl(urlString: string): string {
    return /^https?:\/\//i.test(urlString) ? urlString : 'https://' + urlString;
  }

  private isValidUrl(urlString: string): boolean {
    try {
      const url = new URL(this.normalizeUrl(urlString));
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch { return false; }
  }

  private async checkUrlSafety(url: string): Promise<boolean> {
    const blocked = ['porn', 'xxx', 'adult', 'sex', 'casino', 'gambling', 'xvideos', 'pornhub', 'xnxx', 'redtube'];
    return !blocked.some(k => url.toLowerCase().includes(k));
  }
}
