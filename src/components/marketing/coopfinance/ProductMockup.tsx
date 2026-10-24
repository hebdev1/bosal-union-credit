import { ShieldCheck } from 'lucide-react'
import { CoopFinanceLogo } from './Logo'

/**
 * Stylised preview of the agent dashboard. It shows the real module names
 * but no figures: the public site only states verifiable facts, so values
 * are drawn as placeholder bars instead of invented numbers.
 */
export function ProductMockup() {
  return (
    <div className="product-mockup" role="img" aria-label="Aperçu du tableau de bord CoopFinance">
      <div className="mock-sidebar">
        <CoopFinanceLogo compact />
        {[60, 42, 53, 47, 37].map((width, index) => (
          <i key={index} style={{ width: `${width}%` }} />
        ))}
      </div>
      <div className="mock-main">
        <div className="mock-top">
          <span>Vue d’ensemble</span>
          <div />
        </div>
        <div className="mock-title">
          <div>
            <strong>Tableau de bord</strong>
            <span>Situation de la coopérative en temps réel</span>
          </div>
          <span className="mock-action">+ Nouvelle opération</span>
        </div>
        <div className="mock-kpis">
          {['Membres actifs', 'Épargne totale', 'Solde du coffre'].map((label, index) => (
            <div key={label}>
              <span>{label}</span>
              <strong><i className="mock-skel" style={{ width: `${[54, 70, 62][index]}%` }} /></strong>
              <small><i className="mock-skel mock-skel-green" /></small>
            </div>
          ))}
        </div>
        <div className="mock-content">
          <div className="mock-chart">
            <strong>Dépôts et retraits</strong>
            <div>
              {[36, 43, 48, 54, 63, 68, 76, 83, 91].map(height => (
                <i key={height} style={{ height: `${height}%` }} />
              ))}
            </div>
          </div>
          <div className="mock-health">
            <strong>Contrôles</strong>
            <div>
              <span><ShieldCheck size={22} aria-hidden="true" /></span>
            </div>
            <small>Alertes actives</small>
          </div>
        </div>
      </div>
    </div>
  )
}
