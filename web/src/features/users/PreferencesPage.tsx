import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { updatePreferences } from '../../services/users';
import { useAuth } from '../../lib/auth-context';

const channels = ['EMAIL', 'SMS', 'WHATSAPP'] as const;
const reminders = [7, 3, 1, 0] as const;

type PreferencesValues = {
  notificationChannels: string[];
  reminderDays: string[];
};

export function PreferencesPage() {
  const { user, refreshUser } = useAuth();
  const { register, handleSubmit, reset } = useForm<PreferencesValues>({
    defaultValues: {
      notificationChannels: user?.notificationChannels ?? ['EMAIL'],
      reminderDays: (user?.reminderDays ?? [7, 3, 1, 0]).map(String),
    },
  });

  useEffect(() => {
    reset({
      notificationChannels: user?.notificationChannels ?? ['EMAIL'],
      reminderDays: (user?.reminderDays ?? [7, 3, 1, 0]).map(String),
    });
  }, [reset, user]);

  async function onSubmit(values: PreferencesValues) {
    await updatePreferences({
      notificationChannels: values.notificationChannels,
      reminderDays: values.reminderDays.map(Number),
    });
    await refreshUser();
  }

  return (
    <section className="panel preferences">
      <div className="eyebrow">Preferências</div>
      <h2>Notificações</h2>
      <p>Ajuste canais e antecedência dos lembretes.</p>

      <form className="preferences-form" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <h3>Canais</h3>
          <div className="checkbox-grid">
            {channels.map((channel) => (
              <label key={channel} className="checkbox-item">
                <input type="checkbox" value={channel} {...register('notificationChannels')} />
                <span>{channel}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3>Dias antes</h3>
          <div className="checkbox-grid">
            {reminders.map((day) => (
              <label key={day} className="checkbox-item">
                <input type="checkbox" value={String(day)} {...register('reminderDays')} />
                <span>{day === 0 ? 'No dia' : `${day} dias antes`}</span>
              </label>
            ))}
          </div>
        </div>

        <button className="primary-button" type="submit">
          Salvar preferências
        </button>
      </form>
    </section>
  );
}
