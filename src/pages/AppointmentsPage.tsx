import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ErrorAlert } from '../components/ErrorAlert';
import { StatusBadge } from '../components/StatusBadge';
import { useAppointments, useCancelAppointment, useProfessionals } from '../hooks/queries';
import { formatDateTime, formatPrice, toBusinessDate } from '../lib/format';
import type { AppointmentFilters, AppointmentStatus } from '../lib/types';

export function AppointmentsPage() {
  // Filters live in the URL (?status=scheduled), so the page can be shared and survives a refresh.
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') ?? '';
  const professionalId = searchParams.get('professionalId') ?? '';
  const date = searchParams.get('date') ?? '';

  // status and professional are filtered by the API; date is a client-side filter on top.
  const apiFilters: AppointmentFilters = {
    status: (status || undefined) as AppointmentStatus | undefined,
    professionalId: professionalId || undefined,
  };

  const professionals = useProfessionals();
  const appointments = useAppointments(apiFilters);
  const cancel = useCancelAppointment();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  function setFilter(name: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(name, value);
    else next.delete(name);
    setSearchParams(next, { replace: true });
  }

  const rows = (appointments.data ?? []).filter(
    (a) => !date || toBusinessDate(a.startsAt) === date,
  );

  return (
    <section>
      <div className="page-head">
        <h1>Agendamentos</h1>
        <Link className="btn btn-primary" to="/appointments/new">
          + Novo agendamento
        </Link>
      </div>

      <div className="card filters">
        <div className="field">
          <label htmlFor="f-status">Status</label>
          <select
            id="f-status"
            value={status}
            onChange={(e) => setFilter('status', e.target.value)}
          >
            <option value="">Todos</option>
            <option value="scheduled">Agendado</option>
            <option value="canceled">Cancelado</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-professional">Profissional</label>
          <select
            id="f-professional"
            value={professionalId}
            onChange={(e) => setFilter('professionalId', e.target.value)}
          >
            <option value="">Todos</option>
            {professionals.data?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-date">Data</label>
          <input
            id="f-date"
            type="date"
            value={date}
            onChange={(e) => setFilter('date', e.target.value)}
          />
        </div>
        {(status || professionalId || date) && (
          <button type="button" className="btn btn-ghost" onClick={() => setSearchParams({})}>
            Limpar filtros
          </button>
        )}
      </div>

      <ErrorAlert error={appointments.error ?? cancel.error} />
      {cancel.isSuccess && !cancel.error && (
        <div className="alert alert-success" role="status">
          Agendamento cancelado. O horário voltou a ficar livre.
        </div>
      )}

      {appointments.isPending ? (
        <p className="muted">Carregando agendamentos…</p>
      ) : rows.length === 0 ? (
        <div className="card empty">Nenhum agendamento encontrado com esses filtros.</div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Quando</th>
                <th>Cliente</th>
                <th>Profissional</th>
                <th>Serviço</th>
                <th>Status</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td>{formatDateTime(a.startsAt)}</td>
                  <td>
                    {a.client.name}
                    <small className="muted block">{a.client.email}</small>
                  </td>
                  <td>{a.professional.name}</td>
                  <td>
                    {a.service.name}
                    <small className="muted block">
                      {a.service.durationMinutes} min · {formatPrice(a.service.priceCents)}
                    </small>
                  </td>
                  <td>
                    <StatusBadge status={a.status} />
                  </td>
                  <td>
                    <div className="actions">
                      {a.status === 'scheduled' &&
                        (confirmingId === a.id ? (
                          <>
                            <button
                              type="button"
                              className="btn btn-danger"
                              disabled={cancel.isPending}
                              onClick={() =>
                                cancel.mutate(a.id, { onSettled: () => setConfirmingId(null) })
                              }
                            >
                              Confirmar cancelamento
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost"
                              onClick={() => setConfirmingId(null)}
                            >
                              Voltar
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => {
                              cancel.reset();
                              setConfirmingId(a.id);
                            }}
                          >
                            Cancelar
                          </button>
                        ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
