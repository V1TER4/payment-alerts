import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { listUsers, updateUserPermissions } from '../../services/users';
import { allPermissions, permissionLabels } from '../../services/permissions';
import { Permission } from '../../types';
import { useAuth } from '../../lib/auth-context';

export function PermissionsPage() {
  const queryClient = useQueryClient();
  const { user, refreshUser } = useAuth();
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: listUsers,
  });
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (!selectedUserId && users?.length) {
      setSelectedUserId(users[0].id);
      setSelectedPermissions(users[0].permissions);
      return;
    }

    const selected = users?.find((user) => user.id === selectedUserId);
    if (selected) {
      setSelectedPermissions(selected.permissions);
    }
  }, [selectedUserId, users]);

  const mutation = useMutation({
    mutationFn: () => updateUserPermissions(selectedUserId, selectedPermissions as Permission[]),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      if (user?.id === selectedUserId) {
        await refreshUser();
      }
    },
  });

  return (
    <section className="panel section-panel">
      <div className="section-title">
        <div>
          <div className="eyebrow">Permissões</div>
          <h2>Gerenciamento de acesso</h2>
        </div>
      </div>

      <div className="permissions-layout">
        <aside className="panel permissions-list">
          {(users ?? []).map((user) => (
            <button
              key={user.id}
              type="button"
              className={selectedUserId === user.id ? 'side-link active' : 'side-link'}
              onClick={() => {
                setSelectedUserId(user.id);
                setSelectedPermissions(user.permissions);
              }}
            >
              {user.name}
            </button>
          ))}
        </aside>

        <div>
          <div className="permission-grid">
            {allPermissions.map((permission) => (
              <label key={permission} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={selectedPermissions.includes(permission)}
                  onChange={(event) => {
                    setSelectedPermissions((current) =>
                      event.target.checked
                        ? [...current, permission]
                        : current.filter((item) => item !== permission),
                    );
                  }}
                  disabled={users?.find((u) => u.id === selectedUserId)?.role === 'SYSTEM'}
                />
                <span>{permissionLabels[permission]}</span>
              </label>
            ))}
          </div>

          <button className="primary-button" type="button" onClick={() => mutation.mutate()}>
            Salvar permissões
          </button>
        </div>
      </div>
    </section>
  );
}
