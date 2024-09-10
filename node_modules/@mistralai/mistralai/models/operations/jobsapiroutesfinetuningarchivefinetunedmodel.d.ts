import * as z from "zod";
export type JobsApiRoutesFineTuningArchiveFineTunedModelRequest = {
    /**
     * The ID of the model to archive.
     */
    modelId: string;
};
/** @internal */
export declare const JobsApiRoutesFineTuningArchiveFineTunedModelRequest$inboundSchema: z.ZodType<JobsApiRoutesFineTuningArchiveFineTunedModelRequest, z.ZodTypeDef, unknown>;
/** @internal */
export type JobsApiRoutesFineTuningArchiveFineTunedModelRequest$Outbound = {
    model_id: string;
};
/** @internal */
export declare const JobsApiRoutesFineTuningArchiveFineTunedModelRequest$outboundSchema: z.ZodType<JobsApiRoutesFineTuningArchiveFineTunedModelRequest$Outbound, z.ZodTypeDef, JobsApiRoutesFineTuningArchiveFineTunedModelRequest>;
/**
 * @internal
 * @deprecated This namespace will be removed in future versions. Use schemas and types that are exported directly from this module.
 */
export declare namespace JobsApiRoutesFineTuningArchiveFineTunedModelRequest$ {
    /** @deprecated use `JobsApiRoutesFineTuningArchiveFineTunedModelRequest$inboundSchema` instead. */
    const inboundSchema: z.ZodType<JobsApiRoutesFineTuningArchiveFineTunedModelRequest, z.ZodTypeDef, unknown>;
    /** @deprecated use `JobsApiRoutesFineTuningArchiveFineTunedModelRequest$outboundSchema` instead. */
    const outboundSchema: z.ZodType<JobsApiRoutesFineTuningArchiveFineTunedModelRequest$Outbound, z.ZodTypeDef, JobsApiRoutesFineTuningArchiveFineTunedModelRequest>;
    /** @deprecated use `JobsApiRoutesFineTuningArchiveFineTunedModelRequest$Outbound` instead. */
    type Outbound = JobsApiRoutesFineTuningArchiveFineTunedModelRequest$Outbound;
}
//# sourceMappingURL=jobsapiroutesfinetuningarchivefinetunedmodel.d.ts.map