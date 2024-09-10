import * as z from "zod";
export type JobsApiRoutesFineTuningGetFineTuningJobRequest = {
    /**
     * The ID of the job to analyse.
     */
    jobId: string;
};
/** @internal */
export declare const JobsApiRoutesFineTuningGetFineTuningJobRequest$inboundSchema: z.ZodType<JobsApiRoutesFineTuningGetFineTuningJobRequest, z.ZodTypeDef, unknown>;
/** @internal */
export type JobsApiRoutesFineTuningGetFineTuningJobRequest$Outbound = {
    job_id: string;
};
/** @internal */
export declare const JobsApiRoutesFineTuningGetFineTuningJobRequest$outboundSchema: z.ZodType<JobsApiRoutesFineTuningGetFineTuningJobRequest$Outbound, z.ZodTypeDef, JobsApiRoutesFineTuningGetFineTuningJobRequest>;
/**
 * @internal
 * @deprecated This namespace will be removed in future versions. Use schemas and types that are exported directly from this module.
 */
export declare namespace JobsApiRoutesFineTuningGetFineTuningJobRequest$ {
    /** @deprecated use `JobsApiRoutesFineTuningGetFineTuningJobRequest$inboundSchema` instead. */
    const inboundSchema: z.ZodType<JobsApiRoutesFineTuningGetFineTuningJobRequest, z.ZodTypeDef, unknown>;
    /** @deprecated use `JobsApiRoutesFineTuningGetFineTuningJobRequest$outboundSchema` instead. */
    const outboundSchema: z.ZodType<JobsApiRoutesFineTuningGetFineTuningJobRequest$Outbound, z.ZodTypeDef, JobsApiRoutesFineTuningGetFineTuningJobRequest>;
    /** @deprecated use `JobsApiRoutesFineTuningGetFineTuningJobRequest$Outbound` instead. */
    type Outbound = JobsApiRoutesFineTuningGetFineTuningJobRequest$Outbound;
}
//# sourceMappingURL=jobsapiroutesfinetuninggetfinetuningjob.d.ts.map