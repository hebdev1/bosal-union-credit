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
    description: 'Tout ce que Bosal Credit Union offre pour digitaliser votre coopérative haïtienne : comptes, prêts, change, caisse, rapports.',
    section: 'Produit',
    icon: 'Sparkles',
  },
  {
    slug: '/comment-ca-marche',
    title: 'Comment ça marche',
    eyebrow: 'Produit',
    description: 'De l’inscription au premier décaissement : découvrez les 4 étapes pour déployer Bosal Credit Union dans votre coopérative.',
    section: 'Produit',
    icon: 'Workflow',
  },
  {
    slug: '/tarifs',
    title: 'Tarifs',
    eyebrow: 'Produit',
    description: 'Trois formules pensées pour la coopérative haïtienne : Starter, Croissance et Entreprise. Sans engagement, sans surprise.',
    section: 'Produit',
    icon: 'Tag',
  },
  {
    slug: '/securite',
    title: 'Sécurité',
    eyebrow: 'Produit',
    description: 'Chiffrement AES-256, audit trail, sauvegardes quotidiennes, conformité BRH : votre coopérative et vos membres protégés.',
    section: 'Produit',
    icon: 'Shield',
  },
  {
    slug: '/changelog',
    title: 'Mises à jour',
    eyebrow: 'Produit',
    description: 'Chaque amélioration, chaque correctif, chaque nouvelle devise. Suivez l’évolution de la plateforme en temps réel.',
    section: 'Produit',
    icon: 'GitCommit',
  },

  // ── Solutions ───────────────────────────────────────────────────
  {
    slug: '/solutions/epargne',
    title: "Coopératives d'épargne",
    eyebrow: 'Solutions',
    description: "Gestion des comptes épargne membres, calcul automatique des intérêts, relevés PDF et suivi des parts sociales.",
    section: 'Solutions',
    icon: 'Banknote',
  },
  {
    slug: '/solutions/prets',
    title: 'Gestion de prêts',
    eyebrow: 'Solutions',
    description: 'Demande, approbation, déboursement et recouvrement — un cycle de prêt complet avec échéancier automatique.',
    section: 'Solutions',
    icon: 'Landmark',
  },
  {
    slug: '/solutions/change',
    title: 'Bureau de change',
    eyebrow: 'Solutions',
    description: 'HTG · USD · CAD · DOP — taux quotidiens, tickets imprimables, reporting des marges et volumes journaliers.',
    section: 'Solutions',
    icon: 'TrendingUp',
  },
  {
    slug: '/solutions/caisse',
    title: 'Caisse & coffre',
    eyebrow: 'Solutions',
    description: 'Ouverture et clôture de caisse, transferts coffre ↔ caisse, réconciliation et contrôle des écarts en temps réel.',
    section: 'Solutions',
    icon: 'Vault',
  },
  {
    slug: '/solutions/agences',
    title: 'Multi-agences',
    eyebrow: 'Solutions',
    description: 'Gérez plusieurs succursales sous une seule coopérative : consolidation financière, permissions par agence, rapports groupés.',
    section: 'Solutions',
    icon: 'Network',
  },

  // ── Ressources ──────────────────────────────────────────────────
  {
    slug: '/docs',
    title: 'Documentation',
    eyebrow: 'Ressources',
    description: 'Guides pas-à-pas, manuels utilisateur et procédures pour agents, gestionnaires et administrateurs.',
    section: 'Ressources',
    icon: 'BookOpen',
  },
  {
    slug: '/api-reference',
    title: 'API',
    eyebrow: 'Ressources',
    description: 'Intégrez Bosal Credit Union à vos outils internes via notre API REST — endpoints comptes, prêts, transactions, webhooks.',
    section: 'Ressources',
    icon: 'Code2',
  },
  {
    slug: '/aide',
    title: "Centre d'aide",
    eyebrow: 'Ressources',
    description: 'FAQ, tutoriels vidéo et résolution des problèmes courants. Notre équipe support répond en moins de 24h.',
    section: 'Ressources',
    icon: 'LifeBuoy',
  },
  {
    slug: '/statut',
    title: 'Statut système',
    eyebrow: 'Ressources',
    description: 'Disponibilité des services en temps réel, historique des incidents et fenêtres de maintenance planifiées.',
    section: 'Ressources',
    icon: 'Activity',
  },
  {
    slug: '/blog',
    title: 'Blog',
    eyebrow: 'Ressources',
    description: 'Actualités du secteur coopératif haïtien, études de cas et bonnes pratiques de gestion financière.',
    section: 'Ressources',
    icon: 'Newspaper',
  },

  // ── Entreprise ──────────────────────────────────────────────────
  {
    slug: '/a-propos',
    title: 'À propos',
    eyebrow: 'Entreprise',
    description: "Notre mission : renforcer la coopérative haïtienne par la technologie. L'équipe, la vision, les valeurs.",
    section: 'Entreprise',
    icon: 'Users',
  },
  {
    slug: '/contact',
    title: 'Contact',
    eyebrow: 'Entreprise',
    description: 'Parlons de votre coopérative. Notre équipe à Port-au-Prince vous accompagne avant, pendant et après le déploiement.',
    section: 'Entreprise',
    icon: 'Mail',
  },
  {
    slug: '/partenaires',
    title: 'Partenaires',
    eyebrow: 'Entreprise',
    description: "Cabinets comptables, intégrateurs, fédérations coopératives — rejoignez l'écosystème Bosal Credit Union.",
    section: 'Entreprise',
    icon: 'Handshake',
  },
  {
    slug: '/cgu',
    title: "Conditions d'utilisation",
    eyebrow: 'Entreprise',
    description: 'Les règles du jeu pour utiliser Bosal Credit Union : droits, devoirs, responsabilités. Rédigées en français clair.',
    section: 'Entreprise',
    icon: 'FileText',
  },
  {
    slug: '/confidentialite',
    title: 'Confidentialité',
    eyebrow: 'Entreprise',
    description: 'Vos données, vos règles. Comment Bosal Credit Union collecte, stocke et protège les informations de votre coopérative.',
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
