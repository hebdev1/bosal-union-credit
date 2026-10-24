/**
 * Marketing pages registry — source of truth for every public page
 * Used for interconnection (breadcrumbs, related links, sitemap)
 */

export type MarketingSection = 'Produit' | 'Solutions' | 'Ressources' | 'Entreprise'

export interface MarketingPage {
  slug: string             // URL path starting with /
  title: string            // Short page title
  eyebrow: string          // Section label above hero
  description: string      // Hero subtitle (1-2 sentences)
  section: MarketingSection
  icon?: string            // lucide icon name
}

export const MARKETING_PAGES: MarketingPage[] = [
  // ── Produit ─────────────────────────────────────────────────────
  {
    slug: '/fonctionnalites',
    title: 'Fonctionnalités',
    eyebrow: 'Produit',
    description: 'Ce que CoopFinance fait aujourd’hui : membres, comptes en gourdes et en dollars, guichet avec reçus PDF, registre des prêts, bureau de change, coffre et contrôles.',
    section: 'Produit',
    icon: 'Sparkles',
  },
  {
    slug: '/comment-ca-marche',
    title: 'Comment ça marche',
    eyebrow: 'Produit',
    description: 'De la demande de démonstration aux premières opérations au guichet : comment notre équipe met en place CoopFinance pour votre coopérative.',
    section: 'Produit',
    icon: 'Workflow',
  },
  {
    slug: '/tarifs',
    title: 'Tarification',
    eyebrow: 'Produit',
    description: 'Trois formules dimensionnées selon vos membres et vos besoins, sur devis après un échange avec votre institution.',
    section: 'Produit',
    icon: 'Tag',
  },
  {
    slug: '/securite',
    title: 'Sécurité',
    eyebrow: 'Produit',
    description: 'Données isolées par coopérative, accès vérifiés par rôle, journal d’audit, connexions chiffrées et sauvegardes quotidiennes.',
    section: 'Produit',
    icon: 'Shield',
  },
  {
    slug: '/changelog',
    title: 'Mises à jour',
    eyebrow: 'Produit',
    description: 'Les changements apportés à l’application, mois par mois, depuis le premier enregistrement de son code en avril 2026.',
    section: 'Produit',
    icon: 'GitCommit',
  },

  // ── Solutions ───────────────────────────────────────────────────
  {
    slug: '/solutions/epargne',
    title: 'Épargne & comptes membres',
    eyebrow: 'Solutions',
    description: 'Comptes en gourdes ou en dollars, dépôts et retraits au guichet avec reçu PDF, relevé de compte et reprise de vos registres papier.',
    section: 'Solutions',
    icon: 'Banknote',
  },
  {
    slug: '/solutions/prets',
    title: 'Suivi des prêts',
    eyebrow: 'Solutions',
    description: 'Saisie des demandes, décision par un gérant ou un administrateur, échéancier à taux fixe et enregistrement de chaque remboursement.',
    section: 'Solutions',
    icon: 'Landmark',
  },
  {
    slug: '/solutions/change',
    title: 'Bureau de change',
    eyebrow: 'Solutions',
    description: 'HTG, USD, CAD et DOP : des taux fixés par paire de devises, un montant calculé par la base de données et un ticket client de 80 mm pour chaque opération.',
    section: 'Solutions',
    icon: 'TrendingUp',
  },
  {
    slug: '/solutions/caisse',
    title: 'Suivi du coffre',
    eyebrow: 'Solutions',
    description: 'Un solde de coffre recalculé par la base de données après chaque dépôt ou retrait. L’ouverture et la clôture de caisse ne sont pas encore disponibles.',
    section: 'Solutions',
    icon: 'Vault',
  },
  {
    slug: '/solutions/agences',
    title: 'Multi-agences — en préparation',
    eyebrow: 'Solutions',
    description: 'La gestion de plusieurs agences n’est pas encore disponible. Aujourd’hui, chaque coopérative travaille dans un seul espace, avec des données isolées de celles des autres institutions.',
    section: 'Solutions',
    icon: 'Network',
  },

  // ── Ressources ──────────────────────────────────────────────────
  {
    slug: '/docs',
    title: 'Documentation',
    eyebrow: 'Ressources',
    description: 'La documentation détaillée de CoopFinance n’est pas encore publiée. En attendant, le centre d’aide répond aux questions les plus courantes.',
    section: 'Ressources',
    icon: 'BookOpen',
  },
  {
    slug: '/api-reference',
    title: 'API et exports',
    eyebrow: 'Ressources',
    description: 'Pas d’API publique pour le moment : CoopFinance s’utilise par son application web. Les transactions, les prêts et les opérations de change s’exportent en CSV et en PDF.',
    section: 'Ressources',
    icon: 'Code2',
  },
  {
    slug: '/aide',
    title: 'Centre d’aide',
    eyebrow: 'Ressources',
    description: 'Réponses aux questions courantes sur CoopFinance : guichet et reçus, saisies historiques, comptes, change, prêts, rôles et données.',
    section: 'Ressources',
    icon: 'LifeBuoy',
  },
  {
    slug: '/statut',
    title: 'Statut des services',
    eyebrow: 'Ressources',
    description: 'CoopFinance ne publie pas encore de suivi de disponibilité en temps réel. Voici comment nous signaler un problème.',
    section: 'Ressources',
    icon: 'Activity',
  },
  {
    slug: '/blog',
    title: 'Blog',
    eyebrow: 'Ressources',
    description: 'Aucun article n’a encore été publié. En attendant, découvrez l’application ou écrivez-nous.',
    section: 'Ressources',
    icon: 'Newspaper',
  },

  // ── Entreprise ──────────────────────────────────────────────────
  {
    slug: '/a-propos',
    title: 'À propos',
    eyebrow: 'Entreprise',
    description: 'Notre mission : donner aux coopératives haïtiennes des outils fiables pour gérer leurs opérations et servir leurs membres.',
    section: 'Entreprise',
    icon: 'Users',
  },
  {
    slug: '/contact',
    title: 'Contact',
    eyebrow: 'Entreprise',
    description: 'Parlez-nous de votre coopérative : nous revenons vers vous pour organiser une démonstration adaptée à vos opérations.',
    section: 'Entreprise',
    icon: 'Mail',
  },
  {
    slug: '/partenaires',
    title: 'Partenaires',
    eyebrow: 'Entreprise',
    description: 'Réseaux de coopératives, cabinets comptables, intégrateurs : présentez-nous votre projet. CoopFinance ne propose aucune intégration externe à ce jour.',
    section: 'Entreprise',
    icon: 'Handshake',
  },
  {
    slug: '/cgu',
    title: "Conditions d'utilisation",
    eyebrow: 'Entreprise',
    description: 'Les règles d’utilisation de CoopFinance : accès des agents, responsabilités de chaque coopérative, hébergement et limites du service.',
    section: 'Entreprise',
    icon: 'FileText',
  },
  {
    slug: '/confidentialite',
    title: 'Confidentialité',
    eyebrow: 'Entreprise',
    description: 'Quelles données CoopFinance traite, dans quel but, où elles sont hébergées et combien de temps elles sont conservées.',
    section: 'Entreprise',
    icon: 'Lock',
  },
]

export function getPage(slug: string): MarketingPage | undefined {
  return MARKETING_PAGES.find(p => p.slug === slug)
}

export function getRelatedPages(slug: string, limit = 3): MarketingPage[] {
  const current = getPage(slug)
  if (!current) return MARKETING_PAGES.slice(0, limit)
  // Prefer same section, then fill from other sections
  const sameSection = MARKETING_PAGES.filter(p => p.section === current.section && p.slug !== slug)
  const otherSection = MARKETING_PAGES.filter(p => p.section !== current.section)
  return [...sameSection, ...otherSection].slice(0, limit)
}

export function getBySection(section: MarketingSection): MarketingPage[] {
  return MARKETING_PAGES.filter(p => p.section === section)
}
