import 'dotenv/config';

const network = process.env.NETWORK || 'mainnet';

const envBaseAAs = process.env.BASE_AAS;
if (!envBaseAAs) {
    throw new Error('BASE_AAS env variable is not set');
}

const baseAAs = envBaseAAs
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v);

export const appConfig = {
    port: Number(process.env.WEB_PORT) || 3000,
    cronTime: '0 0 * * * *',
    obyte: {
        baseAAs,
        hub: (network === 'mainnet'
            ? 'obyte.org/bb'
            : 'obyte.org/bb-test'),
    },
};
