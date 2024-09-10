import { ApiData, ApiInfo, Config, EndpointInfo } from "../types";
export declare const runtime_response: {
    stage: string;
    hardware: {
        current: string;
        requested: string;
    };
    storage: {
        current: null;
        requested: null;
    };
    gcTimeout: number;
    replicas: {
        current: number;
        requested: number;
    };
    devMode: boolean;
    domains: {
        domain: string;
        isCustom: boolean;
        stage: string;
    }[];
};
export declare const transformed_api_info: ApiInfo<ApiData>;
export declare const response_api_info: ApiInfo<ApiData>;
export declare const config_response: Config;
export declare const whoami_response: {
    type: string;
    id: string;
    name: string;
    fullname: string;
    email: string;
    emailVerified: boolean;
    canPay: boolean;
    periodEnd: number;
    isPro: boolean;
    avatarUrl: string;
    orgs: never[];
    auth: {
        type: string;
        accessToken: {
            displayName: string;
            role: string;
        };
    };
};
export declare const duplicate_response: {
    url: string;
};
export declare const hardware_sleeptime_response: {
    stage: string;
    hardware: {
        current: string;
        requested: string;
    };
    storage: null;
    gcTimeout: number;
    replicas: {
        current: number;
        requested: number;
    };
    devMode: boolean;
    domains: {
        domain: string;
        isCustom: boolean;
        stage: string;
    }[];
};
export declare const endpoint_info: EndpointInfo<ApiData>;
export declare const discussions_response: {
    discussions: never[];
    count: number;
    start: number;
    numClosedDiscussions: number;
};
//# sourceMappingURL=test_data.d.ts.map