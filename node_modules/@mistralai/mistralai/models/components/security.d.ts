import * as z from "zod";
export type Security = {
    apiKey?: string | undefined;
};
/** @internal */
export declare const Security$inboundSchema: z.ZodType<Security, z.ZodTypeDef, unknown>;
/** @internal */
export type Security$Outbound = {
    ApiKey?: string | undefined;
};
/** @internal */
export declare const Security$outboundSchema: z.ZodType<Security$Outbound, z.ZodTypeDef, Security>;
/**
 * @internal
 * @deprecated This namespace will be removed in future versions. Use schemas and types that are exported directly from this module.
 */
export declare namespace Security$ {
    /** @deprecated use `Security$inboundSchema` instead. */
    const inboundSchema: z.ZodType<Security, z.ZodTypeDef, unknown>;
    /** @deprecated use `Security$outboundSchema` instead. */
    const outboundSchema: z.ZodType<Security$Outbound, z.ZodTypeDef, Security>;
    /** @deprecated use `Security$Outbound` instead. */
    type Outbound = Security$Outbound;
}
//# sourceMappingURL=security.d.ts.map