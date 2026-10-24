import Link from 'next/link'
import { CoopFinanceLogo } from './Logo'

const COLUMNS = [
  {
    title: 'Plateforme',
    links: [
      { label: 'Fonctionnalités', href: '/fonctionnalites' },
      { label: 'Tarification', href: '/tarifs' },
      { label: 'Sécurité', href: '/securite' },
      { label: 'Mises à jour', href: '/changelog' },
    ],
  },
  {
    title: 'Entreprise',
    links: [
      { label: 'À propos', href: '/a-propos' },
      { label: 'Partenaires', href: '/partenaires' },
      { label: 'Nous contacter', href: '/contact' },
    ],
  },
  {
    title: 'Ressources',
    links: [
      { label: 'Comment ça marche', href: '/comment-ca-marche' },
      { label: 'Centre d’aide', href: '/aide' },
      { label: 'Statut des services', href: '/statut' },
    ],
  },
] as const

export function PublicFooter() {
  return (
    <footer className="public-footer" aria-label="Pied de page">
      <div className="footer-main">
        <div className="footer-brand">
          <CoopFinanceLogo />
          <p>
            La plateforme financière pensée pour les institutions qui font
            grandir les communautés.
          </p>
        </div>
        {COLUMNS.map(column => (
          <div key={column.title}>
            <h2 className="footer-title">{column.title}</h2>
            {column.links.map(link => (
              <Link key={link.href} href={link.href}>{link.label}</Link>
            ))}
          </div>
        ))}
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} CoopFinance. Tous droits réservés.</span>
        <div>
          <Link href="/confidentialite">Confidentialité</Link>
          <Link href="/cgu">Conditions</Link>
        </div>
      </div>
    </footer>
  )
}
