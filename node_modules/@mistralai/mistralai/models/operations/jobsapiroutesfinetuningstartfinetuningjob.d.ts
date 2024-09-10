import * as z from "zod";
export type JobsApiRoutesFineTuningStartFineTuningJobRequest = {
    jobId: string;
};
/** @internal */
export declare const JobsApiRoutesFineTuningStartFineTuningJobRequest$inboundSchema: z.ZodType<JobsApiRoutesFineTuningStartFineTuningJobRequest, z.ZodTypeDef, unknown>;
/** @internal */
export type JobsApiRoutesFineTuningStartFineTuningJobRequest$Outbound = {
    job_id: string;
};
/** @internal */
export declare const JobsApiRoutesFineTuningStartFineTuningJobRequest$outboundSchema: z.ZodType<JobsApiRoutesFineTuningStartFineTuningJobRequest$Outbound, z.ZodTypeDef, JobsApiRoutesFineTuningStartFineTuningJobRequest>;
/**
 * @internal
 * @deprecated This namespace will be removed in future versions. Use schemas and types that are exported directly from this module.
 */
export declare namespace JobsApiRoutesFineTuningStartFineTuningJobRequest$ {
    /** @deprecated use `JobsApiRoutesFineTuningStartFineTuningJobRequest$inboundSchema` instead. */
    const inboundSchema: z.ZodType<JobsApiRoutesFineTuningStartFineTuningJobRequest, z.ZodTypeDef, unknown>;
    /** @deprecated use `JobsApiRoutesFineTuningStartFineTuningJobRequest$outboundSchema` instead. */
    const outboundSchema: z.ZodType<JobsApiRoutesFineTuningStartFineTuningJobRequest$Outbound, z.ZodTypeDef, JobsApiRoutesFineTuningStartFineTuningJobRequest>;
    /** @deprecated use `JobsApiRoutesFineTuningStartFineTuningJobRequest$Outbound` instead. */
    type Outbound = JobsApiRoutesFineTuningStartFineTuningJobRequest$Outbound;
}
//# sourceMappingURL=jobsapiroutesfinetuningstartfinetuningjob.d.ts.map