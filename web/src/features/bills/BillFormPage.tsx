import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { listCategories } from '../../services/categories';
import { createBill, getBill, updateBill, type BillFormValues } from '../../services/bills';
import { useAuth } from '../../lib/auth-context';
import {
  formatCurrencyBRL,
  formatCurrencyInput,
  formatDateBR,
  parseCurrencyInput,
  todayInputValue,
  toDateInputValue,
} from '../../lib/format';

const frequencies = [
  { value: 'MONTHLY', label: 'Mensal' },
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'YEARLY', label: 'Anual' },
] as const;

const weekDays = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
] as const;

const months = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
] as const;

export function BillFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canSeeCategories = user?.permissions.includes('categories.view');
  const isEditing = Boolean(id);
  const { data: bill } = useQuery({
    queryKey: ['bill', id],
    queryFn: () => getBill(id as string),
    enabled: Boolean(id),
  });
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: listCategories,
    enabled: Boolean(canSeeCategories),
  });

  const { register, handleSubmit, reset, watch, control, setValue } = useForm<BillFormValues>({
    defaultValues: {
      name: '',
      description: '',
      amount: 0,
      dueDate: todayInputValue(),
      categoryId: '',
      isRecurring: false,
      recurrenceFrequency: 'MONTHLY',
      recurrenceDayOfMonth: 1,
      recurrenceDayOfWeek: 1,
      recurrenceDay: 1,
      recurrenceMonth: 1,
      status: 'PENDING',
    },
  });

  useEffect(() => {
    if (!bill) {
      return;
    }

    reset({
      name: bill.name,
      description: bill.description ?? '',
      amount: Number(bill.amount),
      dueDate: toDateInputValue(bill.dueDate),
      categoryId: bill.categoryId ?? '',
      categoryName: bill.categoryName ?? '',
      isRecurring: bill.isRecurring,
      recurrenceFrequency: bill.recurrenceFrequency ?? 'MONTHLY',
      recurrenceDayOfMonth: bill.recurrenceDayOfMonth ?? 1,
      recurrenceDayOfWeek: bill.recurrenceDayOfWeek ?? 1,
      recurrenceDay: bill.recurrenceDay ?? 1,
      recurrenceMonth: bill.recurrenceMonth ?? 1,
      status: bill.status,
    });
  }, [bill, reset]);

  const createMutation = useMutation({
    mutationFn: createBill,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bills'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate('/bills');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: BillFormValues) => updateBill(id as string, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bills'] });
      await queryClient.invalidateQueries({ queryKey: ['bill', id] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate('/bills');
    },
  });

  const recurring = watch('isRecurring');
  const frequency = watch('recurrenceFrequency');
  const amount = watch('amount');

  async function onSubmit(values: BillFormValues) {
    const payload: BillFormValues = {
      ...values,
      amount: Number(values.amount),
      categoryId: canSeeCategories ? values.categoryId || undefined : undefined,
      categoryName: canSeeCategories ? undefined : values.categoryName?.trim() || bill?.categoryName || undefined,
      dueDate: values.isRecurring ? undefined : values.dueDate,
      recurrenceFrequency: values.isRecurring ? values.recurrenceFrequency : undefined,
      recurrenceDayOfMonth: values.isRecurring && values.recurrenceFrequency === 'MONTHLY'
        ? values.recurrenceDayOfMonth
        : undefined,
      recurrenceDayOfWeek: values.isRecurring && values.recurrenceFrequency === 'WEEKLY'
        ? values.recurrenceDayOfWeek
        : undefined,
      recurrenceDay: values.isRecurring && values.recurrenceFrequency === 'YEARLY'
        ? values.recurrenceDay
        : undefined,
      recurrenceMonth: values.isRecurring && values.recurrenceFrequency === 'YEARLY'
        ? values.recurrenceMonth
        : undefined,
      status: values.status || 'PENDING',
    };

    if (isEditing) {
      updateMutation.mutate(payload);
      return;
    }

    createMutation.mutate(payload);
  }

  return (
    <section className= "panel form-panel" >
    <div className="section-title" >
      <div>
      <div className="eyebrow" > { isEditing? 'Editar conta': 'Nova conta' } </div>
        < h2 > { isEditing? 'Atualize os dados da conta': 'Cadastre uma conta a pagar' } </h2>
        </div>
        < Link className = "ghost-link" to = "/bills" >
          Voltar
          </Link>
          </div>

  {
    bill?.isDueDateNonBusinessDay ? (
      <div className= "notice" >
      O vencimento desta conta cai em dia não útil.O alerta será ajustado para o último dia útil anterior.
          { bill.adjustedDueDate ? ` Data ajustada: ${formatDateBR(bill.adjustedDueDate)}` : null }
    </div>
      ) : null
  }

  <form className="bill-form" onSubmit = { handleSubmit(onSubmit) } >
    <label>
    <span>Nome </span>
    < input {...register('name', { required: true }) } placeholder = "Internet" />
      </label>

      < label >
      <span>Descrição </span>
      < textarea {...register('description') } placeholder = "Detalhe a conta" rows = { 4} />
        </label>

        < div className = "grid-2" >
          <label>
          <span>Valor </span>
          < Controller
  control = { control }
  name = "amount"
  render = {({ field }) => (
    <input
                  type= "text"
  inputMode = "numeric"
  value = { formatCurrencyInput(String(Math.round((field.value ?? 0) * 100)))
}
onChange = {(event) => field.onChange(parseCurrencyInput(event.target.value))}
                />
              )}
            />
  </label>

{
  !recurring ? (
    <label>
    <span>Vencimento </span>
    < input type = "date" {...register('dueDate') } />
      </label>
          ) : (
    <label>
    <span>Frequência </span>
    < select {...register('recurrenceFrequency') }>
    {
      frequencies.map((frequencyItem) => (
        <option key= { frequencyItem.value } value = { frequencyItem.value } >
        { frequencyItem.label }
        </option>
      ))
    }
      </select>
      </label>
          )
}
</div>

  < div className = "grid-2" >
  {
    canSeeCategories?(
            <label>
    <span>Categoria </span>
    < select {...register('categoryId') }>
      <option value="" > Selecione </option>
{
  (categories ?? []).map((category) => (
    <option key= { category.id } value = { category.id } >
    { category.name }
    </option>
  ))
}
</select>
  </label>
          ) : (
  <label>
  <span>Categoria </span>
  < input {...register('categoryName') } placeholder = "Moradia, Energia, Internet..." />
    </label>
          )}

<label>
  <span>Status </span>
  < select {...register('status') }>
    <option value="PENDING" > Pendente </option>
      < option value = "PAID" > Pago </option>
        < option value = "OVERDUE" > Atrasado </option>
          </select>
          </label>
          </div>

          < div className = "grid-2" >
            <label className="checkbox-inline" >
              <input
              type="checkbox"
{...register('isRecurring') }
onChange = {(event) => {
  setValue('isRecurring', event.target.checked, { shouldDirty: true });
}}
            />
  < span > Recorrente </span>
  </label>

{
  recurring ? (
    <div />
  ) : (
    <div className= "muted-line" > Conta única com data completa de vencimento.</div>
          )
}
</div>

{
  recurring ? (
    <div className= "stack" >
    { frequency === 'MONTHLY' ? (
      <label>
      <span>Dia do mês </span>
        < select { ...register('recurrenceDayOfMonth', { valueAsNumber: true }) } >
        {
          Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
            <option key= { day } value = { day } >
            Todo dia { day }
          </option>
          ))
        }
        </select>
    </label>
  ) : null
}

{
  frequency === 'WEEKLY' ? (
    <label>
    <span>Dia da semana </span>
      < select {...register('recurrenceDayOfWeek', { valueAsNumber: true }) }>
      {
        weekDays.map((day) => (
          <option key= { day.value } value = { day.value } >
          Toda { day.label }
        </option>
        ))
      }
        </select>
        </label>
            ) : null
}

{
  frequency === 'YEARLY' ? (
    <div className= "grid-2" >
    <label>
    <span>Dia </span>
    < select {...register('recurrenceDay', { valueAsNumber: true }) }>
    {
      Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
        <option key= { day } value = { day } >
        { day }
        </option>
      ))
    }
      </select>
      </label>

      < label >
      <span>Mês </span>
      < select {...register('recurrenceMonth', { valueAsNumber: true }) }>
      {
        months.map((month) => (
          <option key= { month.value } value = { month.value } >
          { month.label }
          </option>
        ))
      }
        </select>
        </label>
        </div>
            ) : null
}
</div>
        ) : null}

<div className="notice" >
  Valor atual: { formatCurrencyBRL(String(amount ?? 0)) }
</div>

  < button className = "primary-button" type = "submit" >
  { isEditing? 'Salvar alterações': 'Criar conta' }
    </button>
    </form>
    </section>
  );
}
