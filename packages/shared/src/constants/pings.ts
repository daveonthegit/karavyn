export const PING_TYPES = ['regroup', 'moving', 'need_help', 'stopping'] as const;

export const PING_LABELS: Record<(typeof PING_TYPES)[number], string> = {
  regroup: 'Regroup',
  moving: 'Moving',
  need_help: 'Need Help',
  stopping: 'Stopping',
};
