import * as z from "zod";
export type JobMetadataOut = {
    expectedDurationSeconds?: number | null | undefined;
    cost?: number | null | undefined;
    costCurrency?: string | null | undefined;
    trainTokensPerStep?: number | null | undefined;
    trainTokens?: number | null | undefined;
    dataTokens?: number | null | undefined;
    estimatedStartTime?: number | null | undefined;
};
/** @internal */
export declare const JobMetadataOut$inboundSchema: z.ZodType<JobMetadataOut, z.ZodTypeDef, unknown>;
/** @internal */
export type JobMetadataOut$Outbound = {
    expected_duration_seconds?: number | null | undefined;
    cost?: number | null | undefined;
    cost_currency?: string | null | undefined;
    train_tokens_per_step?: number | null | undefined;
    train_tokens?: number | null | undefined;
    data_tokens?: number | null | undefined;
    estimated_start_time?: number | null | undefined;
};
/** @internal */
export declare const JobMetadataOut$outboundSchema: z.ZodType<JobMetadataOut$Outbound, z.ZodTypeDef, JobMetadataOut>;
/**
 * @internal
 * @deprecated This namespace will be removed in future versions. Use schemas and types that are exported directly from this module.
 */
export declare namespace JobMetadataOut$ {
    /** @deprecated use `JobMetadataOut$inboundSchema` instead. */
    const inboundSchema: z.ZodType<JobMetadataOut, z.ZodTypeDef, unknown>;
    /** @deprecated use `JobMetadataOut$outboundSchema` instead. */
    const outboundSchema: z.ZodType<JobMetadataOut$Outbound, z.ZodTypeDef, JobMetadataOut>;
    /** @deprecated use `JobMetadataOut$Outbound` instead. */
    type Outbound = JobMetadataOut$Outbound;
}
//# sourceMappingURL=jobmetadataout.d.ts.map