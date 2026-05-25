import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  CheckSquare,
  FileText,
  PieChart,
  Ticket,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { APPS } from '@/lib/apps'
import { CATEGORY_ACCENT } from './AppLauncher'
import type { DashboardCard } from '@/lib/dashboard-cards'

const ICONS: Record<DashboardCard['icon'], LucideIcon> = {
  'users': Users,
  'ticket': Ticket,
  'calendar-check': CalendarCheck,
  'pie-chart': PieChart,
  'check-square': CheckSquare,
  'bar-chart-3': BarChart3,
  'file-text': FileText,
}

const TONE_COLOR: Record<NonNullable<DashboardCard['highlight']>['tone'], string> = {
  neg:   'var(--neg)',
  amber: 'var(--amber)',
  pos:   'var(--pos)',
}

/**
 * One of the smaller bento cards (2x2 on the right of the featured
 * tile). Renders a single app's headline state — a big number or short
 * phrase, a meta line, and an optional urgency highlight.
 */
export function StatusCard({ card }: { card: DashboardCard }) {
  const app = APPS.find((a) => a.id === card.appSlug)
  if (!app) return null

  const Icon = ICONS[card.icon]
  const accent = CATEGORY_ACCENT[app.category]

  return (
    <a
      className="bento-card"
      href={card.href ?? app.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ '--card-accent': accent } as React.CSSProperties}
    >
      <div className="bento-card-head">
        <span className="bento-card-icon" aria-hidden>
          <Icon size={16} />
        </span>
        <span className="bento-card-name">{app.name}</span>
      </div>
      <div className="bento-card-body">
        <div className="bento-card-primary">{card.primary}</div>
        <div className="bento-card-meta">
          {card.meta}
          {card.highlight && (
            <>
              {' · '}
              <span style={{ color: TONE_COLOR[card.highlight.tone], fontWeight: 600 }}>
                {card.highlight.text}
              </span>
            </>
          )}
        </div>
      </div>
      <ArrowRight className="bento-card-arrow" size={18} aria-hidden />
    </a>
  )
}
