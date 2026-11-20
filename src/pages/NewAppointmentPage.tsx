import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { ErrorAlert } from '../components/ErrorAlert';
import { SlotPicker } from '../components/SlotPicker';
import {
  useAvailability,
  useCreateAppointment,
  useProfessionals,
  useServices,
} from '../hooks/queries';
import { formatPrice, todayInBusinessZone } from '../lib/format';
import { newAppointmentSchema, type NewAppointmentForm } from '../lib/schemas';

export function NewAppointmentPage() {
  const navigate = useNavigate();
  const professionals = useProfessionals();
  const services = useServices();
  const create = useCreateAppointment();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<NewAppointmentForm>({
    resolver: zodResolver(newAppointmentSchema),
    defaultValues: { professionalId: '', serviceId: '', date: '', startsAt: '' },
  });

  const [professionalId, serviceId, date, startsAt] = useWatch({
    control,
    name: ['professionalId', 'serviceId', 'date', 'startsAt'],
  });

  // The free slots come from the API, never computed in the browser (single source of truth).
  const availability = useAvailability(professionalId, serviceId, date);
  const slots = availability.data?.slots ?? [];

  // A chosen slot is only valid for the combination it was loaded for: clear it on change,
  // and also when a refetch shows it is gone (someone else took it, or it was cancelled).
  useEffect(() => {
    if (
      startsAt &&
      availability.data &&
      !availability.data.slots.some((s) => s.startsAt === startsAt)
    ) {
      setValue('startsAt', '');
    }
  }, [startsAt, availability.data, setValue]);

  const service = services.data?.find((s) => s.id === serviceId);

  const onSubmit = handleSubmit((values) => {
    create.mutate(
      {
        professionalId: values.professionalId,
        serviceId: values.serviceId,
        startsAt: values.startsAt,
      },
      { onSuccess: () => navigate('/appointments') },
    );
  });

  return (
    <section>
      <div className="page-head">
        <h1>Novo agendamento</h1>
        <Link className="btn btn-ghost" to="/appointments">
          ← Voltar
        </Link>
      </div>

      <form className="card form" onSubmit={onSubmit} noValidate>
        <ErrorAlert error={professionals.error ?? services.error ?? create.error} />

        <div className="grid-2">
          <div className="field">
            <label htmlFor="professionalId">Profissional</label>
            <select
              id="professionalId"
              {...register('professionalId', {
                onChange: () => setValue('startsAt', ''),
              })}
            >
              <option value="">Selecione…</option>
              {professionals.data?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.specialty ? ` · ${p.specialty}` : ''}
                </option>
              ))}
            </select>
            {errors.professionalId && (
              <span className="field-error">{errors.professionalId.message}</span>
            )}
          </div>

          <div className="field">
            <label htmlFor="serviceId">Serviço</label>
            <select
              id="serviceId"
              {...register('serviceId', { onChange: () => setValue('startsAt', '') })}
            >
              <option value="">Selecione…</option>
              {services.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.durationMinutes} min · {formatPrice(s.priceCents)}
                </option>
              ))}
            </select>
            {errors.serviceId && <span className="field-error">{errors.serviceId.message}</span>}
          </div>
        </div>

        <div className="field">
          <label htmlFor="date">Data</label>
          <input
            id="date"
            type="date"
            min={todayInBusinessZone()}
            {...register('date', { onChange: () => setValue('startsAt', '') })}
          />
          {errors.date && <span className="field-error">{errors.date.message}</span>}
        </div>

        <div className="field">
          <span className="label">Horários livres</span>
          {!professionalId || !serviceId || !date ? (
            <p className="muted">Escolha profissional, serviço e data para ver os horários.</p>
          ) : availability.isFetching ? (
            <p className="muted">Buscando horários…</p>
          ) : availability.error ? (
            <ErrorAlert error={availability.error} />
          ) : slots.length === 0 ? (
            <p className="muted">
              Nenhum horário livre nesse dia. Tente outra data (o profissional pode não trabalhar
              nesse dia).
            </p>
          ) : (
            <SlotPicker
              slots={slots}
              value={startsAt}
              onChange={(value) => setValue('startsAt', value, { shouldValidate: true })}
            />
          )}
          {errors.startsAt && <span className="field-error">{errors.startsAt.message}</span>}
        </div>

        {service && startsAt && (
          <p className="summary">
            Duração de {service.durationMinutes} min · {formatPrice(service.priceCents)}
          </p>
        )}

        <button className="btn btn-primary" type="submit" disabled={create.isPending}>
          {create.isPending ? 'Agendando…' : 'Confirmar agendamento'}
        </button>
      </form>
    </section>
  );
}
