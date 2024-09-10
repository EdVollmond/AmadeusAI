import * as z from "zod";
export type EmbeddingResponseData = {
    object?: string | undefined;
    embedding?: Array<number> | undefined;
    index?: number | undefined;
};
/** @internal */
export declare const EmbeddingResponseData$inboundSchema: z.ZodType<EmbeddingResponseData, z.ZodTypeDef, unknown>;
/** @internal */
export type EmbeddingResponseData$Outbound = {
    object?: string | undefined;
    embedding?: Array<number> | undefined;
    index?: number | undefined;
};
/** @internal */
export declare const EmbeddingResponseData$outboundSchema: z.ZodType<EmbeddingResponseData$Outbound, z.ZodTypeDef, EmbeddingResponseData>;
/**
 * @internal
 * @deprecated This namespace will be removed in future versions. Use schemas and types that are exported directly from this module.
 */
export declare namespace EmbeddingResponseData$ {
    /** @deprecated use `EmbeddingResponseData$inboundSchema` instead. */
    const inboundSchema: z.ZodType<EmbeddingResponseData, z.ZodTypeDef, unknown>;
    /** @deprecated use `EmbeddingResponseData$outboundSchema` instead. */
    const outboundSchema: z.ZodType<EmbeddingResponseData$Outbound, z.ZodTypeDef, EmbeddingResponseData>;
    /** @deprecated use `EmbeddingResponseData$Outbound` instead. */
    type Outbound = EmbeddingResponseData$Outbound;
}
//# sourceMappingURL=embeddingresponsedata.d.ts.map