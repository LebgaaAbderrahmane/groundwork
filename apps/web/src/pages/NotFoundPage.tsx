import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useDocumentTitle } from '@/lib/hooks'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Head } from '@/components/Head'

export default function NotFoundPage() {
  useDocumentTitle('Page Not Found')

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 pt-24 text-center">
      <Head title="Page Not Found" description="The page you're looking for doesn't exist — head back to Cribstone Coffee." path="/404" />
      <Helmet>
        <meta name="robots" content="noindex" />
      </Helmet>
      <span className="font-display text-7xl font-bold text-accent/30" aria-hidden>
        404
      </span>
      <h1 className="mt-4 font-display text-4xl font-bold text-foreground">
        Lost in the <em className="italic text-accent">beans</em>
      </h1>
      <p className="mt-3 max-w-sm text-sm font-light text-foreground/60">
        That page doesn't exist. Maybe it was on the specials board last week.
      </p>
      <Button asChild size="lg" className="mt-8">
        <Link to="/">
          Back to the site <ArrowRight className="size-4" aria-hidden />
        </Link>
      </Button>
    </main>
  )
}
