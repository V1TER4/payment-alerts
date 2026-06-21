import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { deleteBill, listBills } from '../../services/bills';
import { listCategories } from '../../services/categories';
import { useAuth } from '../../lib/auth-context';
import { formatCurrencyBRL, formatDateBR, todayInputValue } from '../../lib/format';

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'PAID', label: 'Pago' },
  { value: 'OVERDUE', label: 'Atrasado' },
] as const;

export function BillsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canSeeCategories = user?.permissions.includes('categories.view');
  const [from, setFrom] = useState(() => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const year = first.getFullYear();
    const month = String(first.getMonth() + 1).padStart(2, '0');
    const day = String(first.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [to, setTo] = useState(() => todayInputValue());
  const [status, setStatus] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: listCategories,
    enabled: Boolean(canSeeCategories),
  });

  const params = useMemo(
    () => ({
      from,
      to,
      ...(status ? { status } : {}),
      ...(categoryId ? { categoryId } : {}),
    }),
    [categoryId, from, status, to],
  );

  const { data, isLoading } = useQuery({
    queryKey: ['bills', params],
    queryFn: () => listBills(params),
  });

  const removeMutation = useMutation({
    mutationFn: deleteBill,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bills'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return (
    <section className="panel section-panel">
      <div className="section-title">
        <div>
          <div className="eyebrow">Contas</div>
          <h2>Lista de contas a pagar</h2>
        </div>
        <Link className="primary-button inline-button" to="/bills/new">
          Nova conta
        </Link>
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
        <label>
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {canSeeCategories ? (
          <label>
            <span>Categoria</span>
            <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
              <option value="">Todas</option>
              {(categories ?? []).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Conta</th>
              <th>Categoria</th>
              <th>Vencimento</th>
              <th>Status</th>
              <th>Valor</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((bill) => (
              <tr key={bill.id}>
                <td>
                  <strong>{bill.name}</strong>
                  <p>{bill.description ?? 'Sem descrição'}</p>
                </td>
                <td>{bill.categoryName ?? 'Sem categoria'}</td>
                <td>
                  {formatDateBR(bill.dueDate)}
                  {bill.isDueDateNonBusinessDay ? <div className="muted-line">Dia não útil</div> : null}
                </td>
                <td>
                  <span className="status-badge">{bill.status}</span>
                </td>
                <td>{formatCurrencyBRL(bill.amount)}</td>
                <td>
                  <div className="row-actions">
                    <Link className="ghost-link" to={`/bills/${bill.id}/edit`}>
                      Editar
                    </Link>
                    <button
                      type="button"
                      className="danger-link"
                      onClick={() => {
                        if (window.confirm('Remover esta conta?')) {
                          removeMutation.mutate(bill.id);
                        }
                      }}
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && (data?.items.length ?? 0) === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">Nenhuma conta encontrada.</div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
