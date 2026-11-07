'use client'

import { useState, useEffect, useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { useRatings } from './RatingsProvider'
import RatingCard from './RatingCard'

export default function TestimonialsSlider() {
  const { ratings } = useRatings()
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: ratings.length > 2,
    slidesToScroll: 1,
  })

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi, onSelect])

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (!emblaApi || isPaused || ratings.length <= 1) return
    const interval = setInterval(() => {
      if (emblaApi.canScrollNext()) {
        emblaApi.scrollNext()
      } else {
        emblaApi.scrollTo(0)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [emblaApi, isPaused, ratings.length])

  if (ratings.length === 0) return null

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-6">
          {ratings.map((r) => (
            <div key={r.id} className="flex-[0_0_100%] md:flex-[0_0_calc(50%-12px)] min-w-0">
              <RatingCard
                name={r.customer_name}
                country={r.customer_country}
                rating={r.rating}
                comment={r.comment}
                createdAt={r.created_at}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      {ratings.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            disabled={!canScrollPrev && !emblaApi?.scrollSnapList().length}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:border-[var(--accent-gold)] disabled:opacity-30 disabled:cursor-not-allowed transition-all z-10 shadow-lg"
            aria-label="Previous testimonial"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={scrollNext}
            disabled={!canScrollNext && !emblaApi?.scrollSnapList().length}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:border-[var(--accent-gold)] disabled:opacity-30 disabled:cursor-not-allowed transition-all z-10 shadow-lg"
            aria-label="Next testimonial"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </>
      )}

      {/* Dots */}
      {ratings.length > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {ratings.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === selectedIndex ? 'bg-[var(--accent-gold)]' : 'bg-cool-slate-500'
              }`}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
