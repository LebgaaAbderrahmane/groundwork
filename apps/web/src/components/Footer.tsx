import { Link } from 'react-router-dom'
import { Coffee } from 'lucide-react'
import { BRAND } from '@cribstone/shared'
import { NAV_LINKS } from '@/data/content'

export function Footer() {
  return (
    <footer className="bg-footer pb-10 pt-16 text-footer-foreground">
      <div className="container-site flex flex-col items-center gap-8 text-center">
        <Link to="/" className="group flex items-center gap-2.5">
          <Coffee
            className="size-5 text-accent transition-transform duration-200 ease-out group-hover:-rotate-12"
            strokeWidth={1.8}
            aria-hidden
          />
          <span className="font-display text-2xl italic text-accent">
            {BRAND.shortName}
          </span>
        </Link>

        <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="text-[10px] font-medium uppercase tracking-[0.12em] text-footer-foreground/70 transition-colors duration-200 ease-out hover:text-footer-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="text-xs font-light text-footer-foreground/50">
          © {new Date().getFullYear()} {BRAND.name} · {BRAND.address}
        </p>
      </div>
    </footer>
  )
}
