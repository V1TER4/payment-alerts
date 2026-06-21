import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createCategory, deleteCategory, listCategories, updateCategory } from '../../services/categories';

const defaultColors = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#14b8a6'];

export function CategoriesPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [color, setColor] = useState(defaultColors[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState(defaultColors[0]);

  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: listCategories,
  });

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: async () => {
      setName('');
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      await queryClient.invalidateQueries({ queryKey: ['bills'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name?: string; color?: string } }) =>
      updateCategory(id, payload),
    onSuccess: async () => {
      setEditingId(null);
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      await queryClient.invalidateQueries({ queryKey: ['bills'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      await queryClient.invalidateQueries({ queryKey: ['bills'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return (
    <section className="panel section-panel">
      <div className="section-title">
        <div>
          <div className="eyebrow">Categorias</div>
          <h2>Gerenciamento de categorias</h2>
        </div>
      </div>

      <form
        className="category-form"
        onSubmit={(event) => {
          event.preventDefault();
          createMutation.mutate({ name, color });
        }}
      >
        <label>
          <span>Nome</span>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nova categoria" />
        </label>
        <label>
          <span>Cor</span>
          <select value={color} onChange={(event) => setColor(event.target.value)}>
            {defaultColors.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <button className="primary-button" type="submit">
          Criar categoria
        </button>
      </form>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Cor</th>
              <th>Padrão</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((category) => (
              <tr key={category.id}>
                <td>
                  {editingId === category.id ? (
                    <input value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                  ) : (
                    <strong>{category.name}</strong>
                  )}
                </td>
                <td>
                  {editingId === category.id ? (
                    <select value={editingColor} onChange={(e) => setEditingColor(e.target.value)}>
                      {defaultColors.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  ) : (
                    category.color
                  )}
                </td>
                <td>{category.isDefault ? 'Sim' : 'Não'}</td>
                <td>
                  <div className="row-actions">
                    {editingId === category.id ? (
                      <>
                        <button
                          type="button"
                          className="ghost-link"
                          onClick={() =>
                            updateMutation.mutate({
                              id: category.id,
                              payload: { name: editingName, color: editingColor },
                            })
                          }
                        >
                          Salvar
                        </button>
                        <button type="button" className="danger-link" onClick={() => setEditingId(null)}>
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="ghost-link"
                          onClick={() => {
                            setEditingId(category.id);
                            setEditingName(category.name);
                            setEditingColor(category.color);
                          }}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="danger-link"
                          onClick={() => {
                            if (window.confirm('Remover esta categoria?')) {
                              deleteMutation.mutate(category.id);
                            }
                          }}
                        >
                          Excluir
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
