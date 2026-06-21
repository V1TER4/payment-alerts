import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { listNotificationHistory } from '../../services/notifications';
import { formatCurrencyBRL, formatDateBR } from '../../lib/format';

export function NotificationsPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['notification-history', from, to],
    queryFn: () => listNotificationHistory({ from: from || undefined, to: to || undefined }),
  });

  return (
    <section className="panel section-panel">
      <div className="section-title">
        <div>
          <div className="eyebrow">Histórico</div>
          <h2>Envios de notificações</h2>
        </div>
      </div>

      <div className="filters">
        <label>
          <span>De</span>
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        </label>
        <label>
          <span>Até</span>
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </label>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Conta</th>
              <th>Canal</th>
              <th>Status</th>
              <th>Agendado</th>
              <th>Enviado em</th>
              <th>Erro</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.notification.bill.name}</strong>
                  <p>
                    {item.notification.bill.category?.name ?? 'Sem categoria'} -{' '}
                    {formatCurrencyBRL(item.notification.bill.amount)}
                  </p>
                </td>
                <td>{item.channel}</td>
                <td>
                  <span className="status-badge">{item.status}</span>
                </td>
                <td>{formatDateBR(item.notification.scheduledFor)}</td>
                <td>{formatDateBR(item.sentAt)}</td>
                <td>{item.errorMessage ?? '-'}</td>
              </tr>
            ))}
            {!isLoading && (data?.items.length ?? 0) === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">Nenhum envio encontrado.</div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
