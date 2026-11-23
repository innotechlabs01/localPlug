export interface CustomerFeedback {
  bookingId?: string;
  customerId?: string;
  overallRating: number;
  bookingEase: CustomerFeedbackBookingEase | undefined;
  serviceRating: CustomerFeedbackServiceRating | undefined;
  informationClarity: CustomerFeedbackClarity | undefined;
  hadProblem: boolean | undefined;
  problemDescription?: string;
  likedMost?: string;
  improvement?: string;
  wouldBookAgain: CustomerFeedbackBookAgain | undefined;
  recommendationScore: number;
  feltHeard: CustomerFeedbackFeltHeard | undefined;
}

export type CustomerFeedbackBookingEase = 'very_difficult' | 'difficult' | 'neutral' | 'easy' | 'very_easy';
export type CustomerFeedbackServiceRating = 'excellent' | 'good' | 'neutral' | 'bad' | 'very_bad';
export type CustomerFeedbackClarity = 'yes' | 'somewhat' | 'no';
export type CustomerFeedbackBookAgain = 'definitely' | 'probably' | 'unsure' | 'probably_not';
export type CustomerFeedbackFeltHeard = 'completely' | 'yes' | 'somewhat' | 'no' | 'not_at_all';

export type FormStatus = 'idle' | 'editing' | 'submitting' | 'success' | 'error';

export interface FeedbackState {
  status: FormStatus;
  currentStep: number;
  bookingId?: string;
  data: CustomerFeedback;
}

export const TOTAL_STEPS = 10;

export const initialFeedbackData: CustomerFeedback = {
  overallRating: 0,
  bookingEase: undefined,
  serviceRating: undefined,
  informationClarity: undefined,
  hadProblem: undefined,
  problemDescription: '',
  likedMost: '',
  improvement: '',
  wouldBookAgain: undefined,
  recommendationScore: -1,
  feltHeard: undefined,
};
