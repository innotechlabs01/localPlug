import Link from 'next/link'
import Button from '@/app/components/ui/button'
import { useI18n } from '@/lib/i18n'

export default function HeroCta() {
  const { t } = useI18n()
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <Link href="/booking">
        <Button variant="primary" size="lg">
          {t.hero.planNow}
        </Button>
      </Link>
      <a href="#pricing">
        <Button variant="ghost" size="lg">
          {t.hero.viewServices}
        </Button>
      </a>
    </div>
  )
}
