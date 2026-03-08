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
  protected activeTab = signal<'rate' | 'results' | 'goat'>('rate');
  protected goatPhase = signal<'idle' | 'hiding' | 'bang' | 'returning'>('idle');
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

  private readonly socialRateExplanations: Record<string, { Low: string[]; Medium: string[]; High: string[] }> = {
    Facebook: {
      Low:    [
        "Wow how fucking stupid is it to share something from Facebook you dumb bitch.",
        "Holy shit this Facebook garbage smells like a 2012 meme dumpster fire.",
      ],
      Medium: [
        "Well it ain't the absolute shittiest thing to share a Facebook post I guess.",
        "It's still Facebook crap, but at least it's not the worst shit on the internet.",
      ],
      High:   [
        "Yeah okay share that Facebook crap you idiot, maybe someone will give a shit.",
        "Fine drop the Facebook post here, maybe this old-ass platform produced something not totally shitty.",
      ],
    },
    Instagram: {
      Low:    [
        "Jesus Christ sharing Instagram posts in chat again you basic dumbass.",
        "Jesus fucking Christ another fake-ass Instagram post full of filters and bullshit.",
      ],
      Medium: [
        "Well at least it's not the worst shit to drop an Instagram post here.",
        "It's still influencer nonsense but it's not the most unbearable shit.",
      ],
      High:   [
        "Fine go ahead and share your Instagram bullshit you attention-seeking idiot.",
        "Alright share the Instagram crap, maybe the algorithm spat out something halfway decent.",
      ],
    },
    X: {
      Low:    [
        "You fucking cunt, sharing something from X huh? What kind of chronically online bullshit is that.",
        "Dick head, this X post looks like pure rage-bait bullshit from the deepest pit of the internet.",
      ],
      Medium: [
        "Bitch head, It's not the most garbage thing to share an X post I suppose.",
        "It's still chaotic X nonsense but it's not the dumbest shit ever written.",
      ],
      High:   [
        "Yeah alright drop that X post here you loudmouth idiot.",
        "Go ahead share the X post, maybe the dumpster fire produced a funny spark.",
      ],
    },
    TikTok: {
      Low:    [
        "Oh great another brain-rotting TikTok you absolute clown.",
        "This TikTok looks like brain-melting bullshit made for goldfish attention spans.",
      ],
      Medium: [
        "Well it's not the worst crap to share a TikTok I guess.",
        "It's still dopamine-fried TikTok garbage but it's tolerable I guess.",
      ],
      High:   [
        "Fine share the damn TikTok you dopamine-fried idiot.",
        "Fine share the TikTok, maybe it's one of the rare ones that doesn't suck absolute ass.",
      ],
    },
    Snapchat: {
      Low:    [
        "You're really sharing Snapchat shit in a group chat? What the hell is wrong with you.",
        "What the fuck is this Snapchat nonsense, some disappearing bullshit nobody asked for.",
      ],
      Medium: [
        "Okay it's not the dumbest thing to share a Snapchat post I suppose.",
        "It's still pointless Snapchat crap but it's not completely unbearable.",
      ],
      High:   [
        "Yeah sure throw that Snapchat nonsense in here you chaotic bastard.",
        "Sure share the Snapchat thing, maybe the chaos will entertain someone for five seconds.",
      ],
    },
    Reddit: {
      Low:    [
        "Sharing Reddit posts like some basement goblin again you nerd.",
        "This Reddit post reeks of basement-dwelling keyboard-warrior bullshit.",
      ],
      Medium: [
        "Well it ain't the worst garbage to share a Reddit post I guess.",
        "It's still classic Reddit nonsense but at least it's not peak cringe.",
      ],
      High:   [
        "Alright fine share the Reddit crap you smug little bastard.",
        "Fine share the Reddit post, maybe the hive mind produced something funny.",
      ],
    },
    Tumblr: {
      Low:    [
        "Tumblr? Are you fucking serious right now you dramatic weirdo.",
        "This Tumblr post is dramatic internet chaos wrapped in ten layers of bullshit.",
      ],
      Medium: [
        "Well it's not the absolute worst place to share something from I guess.",
        "It's weird Tumblr energy but not the worst crap floating online.",
      ],
      High:   [
        "Fine drop the Tumblr post you chaotic little gremlin.",
        "Alright share the Tumblr post, maybe the weirdness will actually be funny.",
      ],
    },
    Pinterest: {
      Low:    [
        "Pinterest? What the hell is this craft-store bullshit you moron.",
        "What the hell is this Pinterest DIY bullshit, glitter-glued garbage again.",
      ],
      Medium: [
        "Okay it's not the most terrible crap to share from Pinterest.",
        "It's still Pinterest craft nonsense but it's not the worst shit imaginable.",
      ],
      High:   [
        "Yeah whatever share the Pinterest nonsense you DIY disaster.",
        "Fine share the Pinterest thing, maybe the internet glue factory made something cool.",
      ],
    },
    LinkedIn: {
      Low:    [
        "Oh wow a LinkedIn post, what are you gonna motivate us to death you corporate clown.",
        "This LinkedIn post smells like corporate motivational bullshit and fake hustle.",
      ],
      Medium: [
        "Well it's not the worst thing to share a LinkedIn post I guess.",
        "It's still cringe business nonsense but it's not the most painful thing.",
      ],
      High:   [
        "Fine go ahead share that LinkedIn hustle crap you business guru idiot.",
        "Go ahead share the LinkedIn post, maybe the corporate robots wrote something funny.",
      ],
    },
    Threads: {
      Low:    [
        "Threads? Seriously? That app is barely alive you desperate fool.",
        "This Threads post feels like leftover social media bullshit nobody wanted.",
      ],
      Medium: [
        "Well it's not the worst garbage to share a Threads post I guess.",
        "It's still Threads chaos but at least it's not completely useless.",
      ],
      High:   [
        "Alright drop the Threads post here you social media addict.",
        "Fine share the Threads post, maybe the dying platform accidentally made something good.",
      ],
    },
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

  protected setTab(tab: 'rate' | 'results' | 'goat'): void {
    this.activeTab.set(tab);
  }

  protected triggerGoat(): void {
    if (this.goatPhase() !== 'idle') return;
    this.goatPhase.set('hiding');
    setTimeout(() => this.goatPhase.set('bang'), 900);
    setTimeout(() => this.goatPhase.set('returning'), 1900);
    setTimeout(() => this.goatPhase.set('idle'), 2700);
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
      const platform = this.inputMode() === 'social' ? this.selectedSocial() : null;
      const explanationPool = platform && this.socialRateExplanations[platform]
        ? this.socialRateExplanations[platform][selectedRate]
        : this.rateExplanations[selectedRate];
      const selectedExplanation = explanationPool[Math.floor(Math.random() * explanationPool.length)];

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
