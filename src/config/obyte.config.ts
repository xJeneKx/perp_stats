import { registerAs } from '@nestjs/config';

export default registerAs('obyte', () => {
  const envBaseAAs = process.env.BASE_AAS;
  if (!envBaseAAs) {
    throw new Error('BASE_AAS env variable is not set');
  }

  const baseAAs = envBaseAAs
    .split(',')
    .map(v => v.trim())
    .filter(v => v);

  const network = process.env.NETWORK || 'mainnet';

  return {
    baseAAs,
    network,
    hub: network === 'mainnet' ? 'obyte.org/bb' : 'obyte.org/bb-test',
    cronTime: process.env.CRON_TIME || '0 0 * * * *',
  };
});
