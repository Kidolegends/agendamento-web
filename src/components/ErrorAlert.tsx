import { ApiError } from '../lib/api';

const FRIENDLY_TITLES: Record<number, string> = {
  0: 'Sem conexão com o servidor',
  400: 'Confira os dados informados',
  401: 'Sessão inválida',
  403: 'Sem permissão',
  404: 'Não encontrado',
  409: 'Conflito de horário',
  422: 'Regra de agendamento',
  429: 'Muitas tentativas',
};

/** Turns any error into a readable box: a title by status, the API message and field issues. */
export function ErrorAlert({ error }: { error: unknown }) {
  if (!error) return null;

  if (error instanceof ApiError) {
    const title = FRIENDLY_TITLES[error.status] ?? 'Algo deu errado';
    return (
      <div className="alert alert-error" role="alert">
        <strong>{title}</strong>
        <p>{error.message}</p>
        {error.issues.length > 0 && (
          <ul>
            {error.issues.map((issue, index) => (
              <li key={`${issue.field}-${index}`}>
                {issue.field ? <code>{issue.field}</code> : null} {issue.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="alert alert-error" role="alert">
      <strong>Algo deu errado</strong>
      <p>Erro inesperado. Tente novamente.</p>
    </div>
  );
}
