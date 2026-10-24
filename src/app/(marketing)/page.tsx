import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Check,
  CheckCircle2,
  CircleDollarSign,
  HandCoins,
  Landmark,
  LayoutGrid,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
} from 'lucide-react'
import { ProductMockup } from '@/components/marketing/coopfinance/ProductMockup'
import { PublicCallout } from '@/components/marketing/coopfinance/Sections'

export const metadata: Metadata = {
  title: { absolute: 'CoopFinance — Pilotez votre coopérative avec clarté' },
  description:
    'Membres, épargne, crédits, caisse, bureau de change et rapports réunis dans une seule plateforme pour les coopératives financières haïtiennes.',
}

export default function HomePage() {
  return (
    <>
      <section className="public-hero">
        <div className="hero-orb orb-one" aria-hidden="true" />
        <div className="hero-orb orb-two" aria-hidden="true" />
        <div className="public-shell hero-grid">
          <div className="hero-copy">
            <div className="hero-badge">
              <Sparkles size={14} aria-hidden="true" /> Conçu pour les coopératives haïtiennes
            </div>
            <h1>
              Pilotez votre institution financière avec <em>clarté.</em>
            </h1>
            <p>
              Une plateforme unifiée pour gérer les membres, l’épargne, les
              crédits, la caisse et le bureau de change — avec la traçabilité
              que vos équipes et vos membres méritent.
            </p>
            <div className="hero-actions">
              <Link href="/contact" className="public-cta large">
                Demander une démo <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link href="/fonctionnalites" className="explore-link">
                <span>
                  <LayoutGrid size={15} aria-hidden="true" />
                </span>
                Explorer la plateforme
              </Link>
            </div>
            <div className="hero-proof">
              <span>
                <CheckCircle2 size={15} aria-hidden="true" /> Mise en place accompagnée
              </span>
              <span>
                <CheckCircle2 size={15} aria-hidden="true" /> Démonstration avec notre équipe
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <ProductMockup />
            <div className="floating-stat stat-members">
              <span>
                <ReceiptText size={17} aria-hidden="true" />
              </span>
              <div>
                <small>Guichet et bureau de change</small>
                <strong>Reçu PDF instantané</strong>
              </div>
            </div>
            <div className="floating-stat stat-secure">
              <span>
                <ShieldCheck size={17} aria-hidden="true" />
              </span>
              <div>
                <small>Infrastructure</small>
                <strong>Sécurisée</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-strip" aria-label="Institutions visées">
        <div className="public-shell">
          <p>Une plateforme adaptée aux institutions qui comptent</p>
          <div>
            <span>
              <Landmark size={21} aria-hidden="true" /> COOPÉRATIVES
            </span>
            <span>
              <Building2 size={21} aria-hidden="true" /> CAISSES POPULAIRES
            </span>
            <span>
              <HandCoins size={21} aria-hidden="true" /> ÉPARGNE &amp; CRÉDIT
            </span>
            <span>
              <ArrowLeftRight size={21} aria-hidden="true" /> BUREAU DE CHANGE
            </span>
          </div>
        </div>
      </section>

      <section className="public-section features-section">
        <div className="public-shell">
          <div className="section-heading">
            <span>UNE SEULE PLATEFORME</span>
            <h2>Tout ce qu’il faut pour mieux servir vos membres.</h2>
            <p>
              Réduisez les tâches manuelles, sécurisez vos opérations et suivez
              l’activité de votre coopérative au jour le jour.
            </p>
          </div>
          <div className="feature-grid">
            <article className="feature-card featured">
              <span className="feature-icon blue">
                <Users size={22} aria-hidden="true" />
              </span>
              <h3>Membres &amp; comptes</h3>
              <p>
                Une fiche par membre : coordonnées, comptes et prêts, et
                l’historique des opérations de chaque compte.
              </p>
              <div className="member-preview">
                <div>
                  <span className="avatar" aria-hidden="true">
                    <UserRound size={15} />
                  </span>
                  <p>
                    <strong>Fiche membre</strong>
                    <small>Profil · comptes · prêts</small>
                  </p>
                  <span className="badge badge-success">PDF par compte</span>
                </div>
                <div>
                  <small>Devises des comptes</small>
                  <strong>Gourde · Dollar US</strong>
                </div>
              </div>
            </article>
            <article className="feature-card">
              <span className="feature-icon green">
                <HandCoins size={22} aria-hidden="true" />
              </span>
              <h3>Suivi des crédits</h3>
              <p>
                Demande, approbation par un gérant ou un administrateur,
                échéancier calculé automatiquement et saisie de chaque versement.
              </p>
              <div className="loan-preview">
                <div>
                  <span>Demande</span>
                  <span>Approbation</span>
                  <span>Remboursé</span>
                </div>
                <div aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </div>
                <small>Échéancier calculé automatiquement</small>
              </div>
            </article>
            <article className="feature-card">
              <span className="feature-icon amber">
                <ShieldCheck size={22} aria-hidden="true" />
              </span>
              <h3>Contrôles intégrés</h3>
              <p>
                Alertes de fraude, protection contre la double saisie et
                journal d’audit des actions sensibles.
              </p>
              <div className="risk-preview">
                <div>
                  <strong>Alertes</strong>
                  <small>Fréquence, horaires, montants</small>
                </div>
                <span>Journal d’audit</span>
              </div>
            </article>
            <article className="feature-card wide">
              <div>
                <span className="feature-icon purple">
                  <CircleDollarSign size={22} aria-hidden="true" />
                </span>
                <h3>Caisse, change &amp; rapports</h3>
                <p>
                  Solde de caisse recalculé à chaque dépôt ou retrait, bureau de
                  change en quatre devises, rapports d’activité et exports CSV
                  et PDF.
                </p>
                <Link href="/fonctionnalites">
                  Découvrir les fonctionnalités <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>
              <div className="transaction-preview">
                <span>Opérations du guichet</span>
                <div>
                  <i className="in">
                    <ArrowDownLeft size={15} aria-hidden="true" />
                  </i>
                  <p>
                    <strong>Dépôt sur compte</strong>
                    <small>Reçu PDF généré</small>
                  </p>
                  <b>HTG</b>
                </div>
                <div>
                  <i className="out">
                    <ArrowLeftRight size={15} aria-hidden="true" />
                  </i>
                  <p>
                    <strong>Opération de change</strong>
                    <small>Taux du jour appliqué</small>
                  </p>
                  <b>USD → HTG</b>
                </div>
                <div>
                  <i className="out">
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </i>
                  <p>
                    <strong>Retrait</strong>
                    <small>Solde vérifié depuis la fiche du compte</small>
                  </p>
                  <b>HTG</b>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="public-section story-section">
        <div className="public-shell story-grid">
          <div className="story-image">
            <Image
              src="/marketing/equipe-cooperative.jpg"
              alt="Trois professionnels collaborent autour de documents financiers"
              width={1080}
              height={608}
              sizes="(max-width: 760px) 100vw, 520px"
            />
            <div>
              <strong>4 devises</strong>
              <span>HTG, USD, CAD et DOP au bureau de change</span>
            </div>
          </div>
          <div className="story-copy">
            <span className="section-kicker">CRÉÉ POUR VOTRE RÉALITÉ</span>
            <h2>La technologie au service de la finance de proximité.</h2>
            <p>
              CoopFinance est pensé pour les équipes qui connaissent leurs
              membres par leur nom et veulent grandir sans perdre cette
              proximité.
            </p>
            <ul>
              <li>
                <span>
                  <Check size={15} aria-hidden="true" />
                </span>
                <div>
                  <strong>Simple pour chaque rôle</strong>
                  <small>
                    Des accès distincts pour les administrateurs, les gérants
                    et les caissiers.
                  </small>
                </div>
              </li>
              <li>
                <span>
                  <Check size={15} aria-hidden="true" />
                </span>
                <div>
                  <strong>Chaque opération tracée</strong>
                  <small>
                    Journal d’audit, référence sur chaque reçu et protection
                    contre la double saisie.
                  </small>
                </div>
              </li>
              <li>
                <span>
                  <Check size={15} aria-hidden="true" />
                </span>
                <div>
                  <strong>Pensé pour le contexte haïtien</strong>
                  <small>
                    Comptes en gourdes et en dollars, bureau de change en quatre devises.
                  </small>
                </div>
              </li>
            </ul>
            <Link href="/a-propos" className="outline-cta">
              Notre histoire <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <PublicCallout />
    </>
  )
}
