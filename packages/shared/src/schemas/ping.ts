import { z } from 'zod';

export const pingTypeSchema = z.enum(['regroup', 'moving', 'need_help', 'stopping']);
export const memberStatusSchema = z.enum(['on_my_way', 'here', 'running_late']);

export type PingType = z.infer<typeof pingTypeSchema>;
export type MemberStatus = z.infer<typeof memberStatusSchema>;
