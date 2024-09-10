import * as z from "zod";
export type UpdateFTModelIn = {
    name?: string | null | undefined;
    description?: string | null | undefined;
};
/** @internal */
export declare const UpdateFTModelIn$inboundSchema: z.ZodType<UpdateFTModelIn, z.ZodTypeDef, unknown>;
/** @internal */
export type UpdateFTModelIn$Outbound = {
    name?: string | null | undefined;
    description?: string | null | undefined;
};
/** @internal */
export declare const UpdateFTModelIn$outboundSchema: z.ZodType<UpdateFTModelIn$Outbound, z.ZodTypeDef, UpdateFTModelIn>;
/**
 * @internal
 * @deprecated This namespace will be removed in future versions. Use schemas and types that are exported directly from this module.
 */
export declare namespace UpdateFTModelIn$ {
    /** @deprecated use `UpdateFTModelIn$inboundSchema` instead. */
    const inboundSchema: z.ZodType<UpdateFTModelIn, z.ZodTypeDef, unknown>;
    /** @deprecated use `UpdateFTModelIn$outboundSchema` instead. */
    const outboundSchema: z.ZodType<UpdateFTModelIn$Outbound, z.ZodTypeDef, UpdateFTModelIn>;
    /** @deprecated use `UpdateFTModelIn$Outbound` instead. */
    type Outbound = UpdateFTModelIn$Outbound;
}
//# sourceMappingURL=updateftmodelin.d.ts.map