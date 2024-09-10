import * as z from "zod";
export type DeleteModelV1ModelsModelIdDeleteRequest = {
    /**
     * The ID of the model to delete.
     */
    modelId: string;
};
/** @internal */
export declare const DeleteModelV1ModelsModelIdDeleteRequest$inboundSchema: z.ZodType<DeleteModelV1ModelsModelIdDeleteRequest, z.ZodTypeDef, unknown>;
/** @internal */
export type DeleteModelV1ModelsModelIdDeleteRequest$Outbound = {
    model_id: string;
};
/** @internal */
export declare const DeleteModelV1ModelsModelIdDeleteRequest$outboundSchema: z.ZodType<DeleteModelV1ModelsModelIdDeleteRequest$Outbound, z.ZodTypeDef, DeleteModelV1ModelsModelIdDeleteRequest>;
/**
 * @internal
 * @deprecated This namespace will be removed in future versions. Use schemas and types that are exported directly from this module.
 */
export declare namespace DeleteModelV1ModelsModelIdDeleteRequest$ {
    /** @deprecated use `DeleteModelV1ModelsModelIdDeleteRequest$inboundSchema` instead. */
    const inboundSchema: z.ZodType<DeleteModelV1ModelsModelIdDeleteRequest, z.ZodTypeDef, unknown>;
    /** @deprecated use `DeleteModelV1ModelsModelIdDeleteRequest$outboundSchema` instead. */
    const outboundSchema: z.ZodType<DeleteModelV1ModelsModelIdDeleteRequest$Outbound, z.ZodTypeDef, DeleteModelV1ModelsModelIdDeleteRequest>;
    /** @deprecated use `DeleteModelV1ModelsModelIdDeleteRequest$Outbound` instead. */
    type Outbound = DeleteModelV1ModelsModelIdDeleteRequest$Outbound;
}
//# sourceMappingURL=deletemodelv1modelsmodeliddelete.d.ts.map