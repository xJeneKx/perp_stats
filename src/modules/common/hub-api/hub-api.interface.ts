export interface ObjectJointTriggerUnit {
    joint: {
        unit: {
            version: string,
            alt: string,
            timestamp: number,
            messages: Array<any>,
            authors: Array<string>,
            last_ball_unit: string,
            last_ball: string,
            witness_list_unit: string,
            parent_units: Array<string>,
            headers_commission: number,
            payload_commission: number,
            unit: string,
            main_chain_index: number
        },
        ball: string
    }
}

export interface PerpetualAADefinition {
    base_aa: string,
    params: {
        reserve_asset: string,
        reserve_price_aa: string,
        swap_fee: number,
        arb_profit_tax: number,
        stakers_fee_share: number,
        adjustment_period: number,
        presale_period: number,
        auction_price_halving_period: number,
        token_share_threshold: number,
        min_s0_share: number,
        max_drift_rate: number
    }
}

type Order = 'ASC' | 'DESC';
export interface GetAAResponsesParams {
    aa: string,
    order: Order,
    min_mci?: number
}

export interface AssetMetadata {
    asset: string;
    decimals: number;
    name: string;
}

export interface AAResponse {
    mci: number;
    trigger_address: string;
    aa_address: string;
    trigger_unit: string;
    bounced: number;
    response_unit: string;
    response: {
        responseVars: {
            price: number;
            swap_fee: number;
            arb_profit_tax: number;
            total_fee: number;
            'fee%': string;
        };
    };
    timestamp: number;
    objResponseUnit: {
        version: string;
        alt: string;
        timestamp: number;
        messages: Array<any>;
        authors: Array<any>;
        last_ball_unit: string;
        last_ball: string;
        witness_list_unit: string;
        parent_units: Array<any>;
        headers_commission: number;
        payload_commission: number;
        unit: string;
        main_chain_index: number;
    };
}