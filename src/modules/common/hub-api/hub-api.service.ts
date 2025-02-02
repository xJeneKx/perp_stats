import network from 'ocore/network';
import { appConfig } from '../config/main.configuration';
import { getLatestPerpetualAAMci } from '../db/db';
import { AAResponse, GetAAResponsesParams, ObjectJointTriggerUnit, PerpetualAADefinition } from './hub-api.interface';

export const getAAsFromBaseAAs = async () => {
    const result = await network.requestFromLightVendor(
        'light/get_aas_by_base_aas',
        {
            base_aas: appConfig.obyte.baseAAs,
        },
    );

    return result.map((v) => v.address);
}

export const requestFromLightVendorWithRetries = async (command: string, params: any, cb?: any, count_retries?: number) => {
    if (!cb) {
        return new Promise(resolve => requestFromLightVendorWithRetries(command, params, resolve));
    }

    count_retries = count_retries || 0;
    network.requestFromLightVendor(command, params, (ws, request, response) => {
        if (response && response.error && Object.keys(response).length === 1) {
            if (response.error.startsWith('[internal]') || response.error.startsWith('[connect to light vendor failed]')) {
                console.error(`got ${response.error} from ${command} ${JSON.stringify(params)}`);

                if (count_retries > 3) {
                    throw Error('got error after 3 retries: ' + response.error);
                }

                return setTimeout(() => requestFromLightVendorWithRetries(command, params, cb, count_retries + 1), 10000);
            } else {
                console.error(`got ${response.error} from ${command} ${JSON.stringify(params)}`);
                //	throw Error(`got ${response.error} from ${command} ${JSON.stringify(params)}`);
            }
        }
        cb(response);
    });
};

export const executeGetter = async (aa: string, getter: string, cb?: any): Promise<number> => {
    if (!cb) {
        return new Promise((resolve, reject) => executeGetter(aa, getter, (err, res) => {
            err ? reject(err) : resolve(res);
        }));
    }

    let params = {
        address: aa,
        getter,
    };

    requestFromLightVendorWithRetries('light/execute_getter', params, (response) => cb(response.error, response.result));
};

export const getAADefinition = async (aa: string, cb?: any): Promise<[string, PerpetualAADefinition]> => {
    if (!cb) {
        return new Promise((resolve, reject) => getAADefinition(aa, (err, res) => {
            err ? reject(err) : resolve(res);
        }));
    }

    requestFromLightVendorWithRetries('light/get_definition', aa, response => cb(response ? response.error : null, response));
};

export const getJoint = async (unit: string, cb?: any): Promise<ObjectJointTriggerUnit> => {
    if (!cb) {
        return new Promise((resolve, reject) => getJoint(unit, (err, res) => {
            err ? reject(err) : resolve(res);
        }));
    }

    requestFromLightVendorWithRetries('get_joint', unit, response => cb(response ? response.error : null, response));
}

interface TriggerUnitData {
    asset?: string,
}

export const getTriggerUnitData = async (triggerUnit: string): Promise<TriggerUnitData> => {
    const objTriggerUnit: ObjectJointTriggerUnit = await getJoint(triggerUnit);

    const messages = objTriggerUnit.joint.unit.messages;

    for (const message of messages) {
        if (message.app === 'data') {
            // AA considers only the first data message
            return message.payload;
        }
    }

    return {};
}

export const getPerpetualAAHistoricalResponses = async (perpetualAA: string): Promise<AAResponse[]> => {
    const latestMci = await getLatestPerpetualAAMci(perpetualAA);

    const params: GetAAResponsesParams = {
        aa: perpetualAA,
        order: 'ASC'
    }

    if (latestMci) {
        params.min_mci = latestMci;
    }

    return network.requestFromLightVendor(
        'light/get_aa_responses',
        params,
    );
}