import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { getDashboardOverview } from '../../services/dashboard';
import { formatCurrencyBRL, formatDateBR, todayInputValue } from '../../lib/format';

const periods = [
  { id: 'month', label: 'Mês atual' },
  { id: '30d', label: '30 dias' },
  { id: 'all', label: 'Tudo' },
] as const;

function resolveRange(period: string) {
  const now = new Date();
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);

  if (period === 'all') {
    return {};
  }

  const from = new Date(now);
  if (period === 'month') {
    from.setDate(1);
    from.setHours(0, 0, 0, 0);
  } else {
    from.setDate(from.getDate() - 30);
    from.setHours(0, 0, 0, 0);
  }

  const fromYear = from.getFullYear();
  const fromMonth = String(from.getMonth() + 1).padStart(2, '0');
  const fromDay = String(from.getDate()).padStart(2, '0');

  return {
    from: `${fromYear}-${fromMonth}-${fromDay}`,
    to: todayInputValue(),
  };
}

export function DashboardPage() {
  const [period, setPeriod] = useState<'month' | '30d' | 'all'>('month');
  const range = resolveRange(period);
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', range.from, range.to],
    queryFn: () => getDashboardOverview(range),
  });

  return (
    <div className="stack">
      <section className="hero panel">
        <div className="hero-head">
          <div>
            <div className="eyebrow">Dashboard</div>
            <h2>Visão geral das contas e notificações.</h2>
            <p>Resumo financeiro com período filtrável e próximos vencimentos.</p>
          </div>

          <div className="period-switch">
            {periods.map((item) => (
              <button
                key={item.id}
                type="button"
                className={period === item.id ? 'pill active' : 'pill'}
                onClick={() => setPeriod(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="hero-grid">
          <div className="metric">
            <span>Total a pagar</span>
            <strong>{isLoading ? '...' : formatCurrencyBRL(data?.metrics.totalToPay ?? 0)}</strong>
          </div>
          <div className="metric">
            <span>Total pago</span>
            <strong>{isLoading ? '...' : formatCurrencyBRL(data?.metrics.totalPaid ?? 0)}</strong>
          </div>
          <div className="metric">
            <span>Contas vencidas</span>
            <strong>{isLoading ? '...' : String(data?.metrics.overdueCount ?? 0)}</strong>
          </div>
          <div className="metric">
            <span>Período</span>
            <strong>
              {data ? `${formatDateBR(data.period.from)} - ${formatDateBR(data.period.to)}` : '...'}
            </strong>
          </div>
        </div>
      </section>

      <section className="panel section-panel">
        <div className="section-title">
          <div>
            <div className="eyebrow">Próximos vencimentos</div>
            <h3>Contas que exigem atenção</h3>
          </div>
          <Link className="ghost-link" to="/bills">
            Ver todas
          </Link>
        </div>

        <div className="card-list">
          {(data?.upcomingBills ?? []).map((bill) => (
            <article key={bill.id} className="card-row">
              <div>
                <strong>{bill.name}</strong>
                <p>
                  {bill.categoryName ?? 'Sem categoria'} - {formatDateBR(bill.dueDate)}
                </p>
              </div>
              <div className="row-meta">
                <span className="status-badge">{bill.status}</span>
                {bill.isDueDateNonBusinessDay ? <span className="warn-badge">Dia não útil</span> : null}
                <strong>{formatCurrencyBRL(bill.amount)}</strong>
              </div>
            </article>
          ))}
          {!isLoading && (data?.upcomingBills.length ?? 0) === 0 ? (
            <div className="empty-state">Nenhuma conta próxima do vencimento.</div>
          ) : null}
        </div>
      </section>

      <section className="panel section-panel">
        <div className="section-title">
          <div>
            <div className="eyebrow">Período filtrado</div>
            <h3>Contas dentro do intervalo selecionado</h3>
          </div>
        </div>

        <div className="card-list">
          {(data?.billsInRange ?? []).map((bill) => (
            <article key={bill.id} className="card-row">
              <div>
                <strong>{bill.name}</strong>
                <p>{bill.description ?? 'Sem descrição'}</p>
              </div>
              <div className="row-meta">
                <span className="status-badge">{bill.status}</span>
                {bill.isDueDateNonBusinessDay ? <span className="warn-badge">Dia não útil</span> : null}
                <strong>{formatCurrencyBRL(bill.amount)}</strong>
              </div>
            </article>
          ))}
          {!isLoading && (data?.billsInRange.length ?? 0) === 0 ? (
            <div className="empty-state">Nenhuma conta para esse período.</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
