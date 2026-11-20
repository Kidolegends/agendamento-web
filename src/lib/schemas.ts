import { z } from 'zod';

// Same rules as the API's Zod schemas, so users get instant feedback before a request is sent.
export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Informe o e-mail').email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha'),
});
export type LoginForm = z.infer<typeof loginSchema>;

export const newAppointmentSchema = z.object({
  professionalId: z.string().min(1, 'Escolha o profissional'),
  serviceId: z.string().min(1, 'Escolha o serviço'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Escolha a data'),
  startsAt: z.string().min(1, 'Escolha um horário livre'),
});
export type NewAppointmentForm = z.infer<typeof newAppointmentSchema>;
