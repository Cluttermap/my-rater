export interface RateEntry {
  count: number;
  texts: string[];
}

export interface UserRatings {
  High: RateEntry;
  Medium: RateEntry;
  Low: RateEntry;
}

export const emptyUserRatings = (): UserRatings => ({
  High:   { count: 0, texts: [] },
  Medium: { count: 0, texts: [] },
  Low:    { count: 0, texts: [] },
});
