import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule, NgClass],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('my-rater');
  protected inputText = signal('');
  protected inputMode = signal<'url' | 'text'>('url');
  protected isLoading = signal(false);
  protected rate = signal<'High' | 'Medium' | 'Low' | null>(null);
  protected rateExplanation = signal<string | null>(null);
  protected errorMessage = signal<string | null>(null);
  protected selectedUser = signal<string | null>(null);

  protected readonly users = [
    { id: 'steve', name: 'Steve', avatar: '👨‍💼' },
    { id: 'jeszi', name: 'Jeszi', avatar: '👩‍💻' },
    { id: 'szabo', name: 'Szabó', avatar: '👨‍🔧' },
    { id: 'levi', name: 'Levi', avatar: '👨‍🎨' }
  ];

  private readonly rateExplanations = {
    Low: [
      'too long',
      'not interesting',
      'boring',
      'too shitty',
      'old and shit',
      'who cares',
      'needs reading',
      'needs reading and understanding',
      'needs AI summary',
      'needs clicking'
    ],
    Medium: [
      "it's all right",
      'mundane',
      'mediocre',
      'eh average post'
    ],
    High: [
      'good post',
      'quite all right',
      'interesting'
    ]
  };

  protected selectUser(userId: string): void {
    this.selectedUser.set(userId);
  }

  protected setInputMode(mode: 'url' | 'text'): void {
    this.inputMode.set(mode);
    this.inputText.set('');
    this.rate.set(null);
    this.rateExplanation.set(null);
    this.errorMessage.set(null);
  }

  protected async getRate(): Promise<void> {
    if (!this.inputText() || !this.selectedUser()) {
      return;
    }

    this.isLoading.set(true);
    this.rate.set(null);
    this.rateExplanation.set(null);
    this.errorMessage.set(null);

    // Only validate URL format if in URL mode
    if (this.inputMode() === 'url') {
      if (!this.isValidUrl(this.inputText())) {
        this.errorMessage.set('Please enter a valid URL (e.g., https://example.com)');
        this.isLoading.set(false);
        return;
      }

      // Check if URL is safe
      const isSafe = await this.checkUrlSafety(this.inputText());

      if (!isSafe) {
        this.errorMessage.set("Sorry, that's not an appropriate website to get a Rate on.");
        this.isLoading.set(false);
        return;
      }
    }

    // Show loading for 2 seconds
    setTimeout(() => {
      // Generate random rate
      const rates: ('High' | 'Medium' | 'Low')[] = ['High', 'Medium', 'Low'];
      const randomRateIndex = Math.floor(Math.random() * rates.length);
      const selectedRate = rates[randomRateIndex];

      // Generate random explanation for the selected rate
      const explanations = this.rateExplanations[selectedRate];
      const randomExplanationIndex = Math.floor(Math.random() * explanations.length);
      const selectedExplanation = explanations[randomExplanationIndex];

      this.rate.set(selectedRate);
      this.rateExplanation.set(selectedExplanation);
      this.isLoading.set(false);
    }, 2000);
  }

  private isValidUrl(urlString: string): boolean {
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private async checkUrlSafety(url: string): Promise<boolean> {
    // Using a basic blocklist approach
    // For production, consider integrating with Google Safe Browsing API
    const blockedKeywords = [
      'porn', 'xxx', 'adult', 'sex', 'casino', 'gambling',
      'xvideos', 'pornhub', 'xnxx', 'redtube'
    ];

    const urlLower = url.toLowerCase();
    const isBlocked = blockedKeywords.some(keyword => urlLower.includes(keyword));

    return !isBlocked;
  }

}
