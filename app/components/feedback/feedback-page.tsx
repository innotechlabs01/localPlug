'use client';

import { useReducer, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import {
  type CustomerFeedback,
  type FeedbackState,
  type FormStatus,
  TOTAL_STEPS,
  initialFeedbackData,
} from './types';
import FeedbackHeader from './feedback-header';
import StarRating from './star-rating';
import EmojiChoice from './emoji-choice';
import OptionButtons from './option-buttons';
import YesNoToggle from './yes-no-toggle';
import TextareaQuestion from './textarea-question';
import FeltHeard from './felt-heard';
import NpsScale from './nps-scale';
import FeedbackSubmit from './feedback-submit';
import FeedbackSuccess from './feedback-success';

type Action =
  | { type: 'SET_FIELD'; field: keyof CustomerFeedback; value: unknown }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'SET_STATUS'; status: FormStatus }
  | { type: 'SET_ERROR' }
  | { type: 'RESET'; bookingId?: string };

function feedbackReducer(state: FeedbackState, action: Action): FeedbackState {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        data: { ...state.data, [action.field]: action.value },
      };
    case 'NEXT_STEP':
      return {
        ...state,
        currentStep: Math.min(state.currentStep + 1, TOTAL_STEPS),
      };
    case 'PREV_STEP':
      return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, 1),
      };
    case 'SET_STATUS':
      return { ...state, status: action.status };
    case 'SET_ERROR':
      return { ...state, status: 'error' };
    case 'RESET':
      return {
        ...getInitialState(action.bookingId),
      };
    default:
      return state;
  }
}

function getInitialState(bookingId?: string): FeedbackState {
  return {
    status: 'editing',
    currentStep: 1,
    bookingId,
    data: { ...initialFeedbackData },
  };
}

async function submitFeedback(data: CustomerFeedback): Promise<{ success: boolean; error?: string }> {
  // Mock submission — swap for POST /api/feedback when backend is ready
  await new Promise((resolve) => setTimeout(resolve, 1200));
  console.log('[Feedback] Submitted:', data);
  return { success: true };
}

export default function FeedbackPageClient() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId') || searchParams.get('booking') || undefined;

  const [state, dispatch] = useReducer(feedbackReducer, null, () => getInitialState(bookingId));

  const updateField = useCallback(
    <K extends keyof CustomerFeedback>(field: K, value: CustomerFeedback[K]) => {
      dispatch({ type: 'SET_FIELD', field, value });
    },
    []
  );

  const handleNext = useCallback(() => {
    dispatch({ type: 'NEXT_STEP' });
  }, []);

  const handlePrev = useCallback(() => {
    dispatch({ type: 'PREV_STEP' });
  }, []);

  const handleSubmit = useCallback(async () => {
    dispatch({ type: 'SET_STATUS', status: 'submitting' });
    try {
      const result = await submitFeedback({ ...state.data, bookingId: state.bookingId });
      if (result.success) {
        dispatch({ type: 'SET_STATUS', status: 'success' });
      } else {
        dispatch({ type: 'SET_ERROR' });
      }
    } catch {
      dispatch({ type: 'SET_ERROR' });
    }
  }, [state.data, state.bookingId]);

  const handleRetry = useCallback(() => {
    dispatch({ type: 'SET_STATUS', status: 'editing' });
  }, []);

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [state.currentStep, state.status]);

  if (state.status === 'success') {
    return <FeedbackSuccess />;
  }

  if (state.status === 'error') {
    return (
      <div className="text-center py-12 animate-[fadeInUp_0.4s_ease]">
        <div className="w-16 h-16 rounded-full bg-[var(--danger)]/15 flex items-center justify-center mx-auto mb-5">
          <span className="text-3xl">😔</span>
        </div>
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-3">
          {t.feedback.error.title}
        </h2>
        <p className="text-[var(--text-secondary)] text-sm mb-6 max-w-sm mx-auto">
          {t.feedback.error.message}
        </p>
        <button
          type="button"
          onClick={handleRetry}
          className="px-8 py-3 rounded-xl bg-gold-gradient text-[var(--bg-dark)] font-semibold text-sm shadow-gold hover:shadow-gold-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
        >
          {t.feedback.error.retry}
        </button>
      </div>
    );
  }

  const renderQuestion = () => {
    switch (state.currentStep) {
      case 1:
        return (
          <QuestionWrapper title={t.feedback.questions.overall}>
            <StarRating
              value={state.data.overallRating}
              onChange={(v) => updateField('overallRating', v)}
            />
          </QuestionWrapper>
        );
      case 2:
        return (
          <QuestionWrapper title={t.feedback.questions.bookingEase}>
            <EmojiChoice
              value={state.data.bookingEase || ''}
              onChange={(v) => updateField('bookingEase', v as CustomerFeedback['bookingEase'])}
            />
          </QuestionWrapper>
        );
      case 3:
        return (
          <QuestionWrapper title={t.feedback.questions.serviceRating}>
            <OptionButtons
              value={state.data.serviceRating || ''}
              onChange={(v) => updateField('serviceRating', v as CustomerFeedback['serviceRating'])}
              options={[
                { key: 'excellent', label: t.feedback.serviceOptions.excellent },
                { key: 'good', label: t.feedback.serviceOptions.good },
                { key: 'neutral', label: t.feedback.serviceOptions.neutral },
                { key: 'bad', label: t.feedback.serviceOptions.bad },
                { key: 'very_bad', label: t.feedback.serviceOptions.veryBad },
              ]}
            />
          </QuestionWrapper>
        );
      case 4:
        return (
          <QuestionWrapper title={t.feedback.questions.informationClarity}>
            <OptionButtons
              value={state.data.informationClarity || ''}
              onChange={(v) => updateField('informationClarity', v as CustomerFeedback['informationClarity'])}
              options={[
                { key: 'yes', label: t.feedback.clarityOptions.yes },
                { key: 'somewhat', label: t.feedback.clarityOptions.somewhat },
                { key: 'no', label: t.feedback.clarityOptions.no },
              ]}
            />
          </QuestionWrapper>
        );
      case 5:
        return (
          <QuestionWrapper title={t.feedback.questions.hadProblem}>
            <YesNoToggle
              value={state.data.hadProblem}
              onChange={(v) => updateField('hadProblem', v)}
              problemDescription={state.data.problemDescription || ''}
              onProblemChange={(v) => updateField('problemDescription', v)}
            />
          </QuestionWrapper>
        );
      case 6:
        return (
          <QuestionWrapper title={t.feedback.questions.likedMost}>
            <TextareaQuestion
              value={state.data.likedMost || ''}
              onChange={(v) => updateField('likedMost', v)}
              placeholder={t.feedback.placeholders.likedMost}
            />
          </QuestionWrapper>
        );
      case 7:
        return (
          <QuestionWrapper title={t.feedback.questions.improvement}>
            <TextareaQuestion
              value={state.data.improvement || ''}
              onChange={(v) => updateField('improvement', v)}
              placeholder={t.feedback.placeholders.improvement}
            />
          </QuestionWrapper>
        );
      case 8:
        return (
          <QuestionWrapper title={t.feedback.questions.wouldBookAgain}>
            <OptionButtons
              value={state.data.wouldBookAgain || ''}
              onChange={(v) => updateField('wouldBookAgain', v as CustomerFeedback['wouldBookAgain'])}
              options={[
                { key: 'definitely', label: t.feedback.bookAgainOptions.definitely },
                { key: 'probably', label: t.feedback.bookAgainOptions.probably },
                { key: 'unsure', label: t.feedback.bookAgainOptions.unsure },
                { key: 'probably_not', label: t.feedback.bookAgainOptions.probablyNot },
              ]}
            />
          </QuestionWrapper>
        );
      case 9:
        return (
          <QuestionWrapper title={t.feedback.questions.recommendation}>
            <NpsScale
              value={state.data.recommendationScore}
              onChange={(v) => updateField('recommendationScore', v)}
            />
          </QuestionWrapper>
        );
      case 10:
        return (
          <QuestionWrapper title={t.feedback.questions.feltHeard}>
            <FeltHeard
              value={state.data.feltHeard || ''}
              onChange={(v) => updateField('feltHeard', v as CustomerFeedback['feltHeard'])}
            />
          </QuestionWrapper>
        );
      default:
        return null;
    }
  };

  // Check if current step has a valid selection
  const isStepValid = (): boolean => {
    switch (state.currentStep) {
      case 1: return state.data.overallRating > 0;
      case 2: return state.data.bookingEase !== undefined;
      case 3: return state.data.serviceRating !== undefined;
      case 4: return state.data.informationClarity !== undefined;
      case 5: return state.data.hadProblem !== undefined;
      case 6: return true; // optional
      case 7: return true; // optional
      case 8: return state.data.wouldBookAgain !== undefined;
      case 9: return state.data.recommendationScore >= 0;
      case 10: return state.data.feltHeard !== undefined;
      default: return true;
    }
  };

  const isLastStep = state.currentStep === TOTAL_STEPS;

  return (
    <div className="w-full max-w-[680px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="bg-[var(--bg-card)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-level-2 p-6 sm:p-10">
        <FeedbackHeader
          currentStep={state.currentStep}
          totalSteps={TOTAL_STEPS}
        />

        {/* Question */}
        <div className="animate-[fadeIn_0.25s_ease]">
          {renderQuestion()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={handlePrev}
            disabled={state.currentStep === 1}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${state.currentStep === 1
                ? 'text-[var(--text-muted)] cursor-not-allowed'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] cursor-pointer'
              }`}
          >
            ← {t.feedback.back}
          </button>

          {isLastStep ? (
            <FeedbackSubmit
              isSubmitting={state.status === 'submitting'}
              disabled={!isStepValid()}
              onSubmit={handleSubmit}
            />
          ) : (
            <button
              type="button"
              onClick={handleNext}
              disabled={!isStepValid()}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                ${isStepValid()
                  ? 'bg-gold-gradient text-[var(--bg-dark)] shadow-gold hover:shadow-gold-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer'
                  : 'bg-[var(--surface)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border)]'
                }`}
            >
              {t.feedback.next} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function QuestionWrapper({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-lg sm:text-xl font-semibold text-[var(--text-primary)] leading-snug">
        {title}
      </h2>
      {children}
    </div>
  );
}
