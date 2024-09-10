import * as z from "zod";
export type DeleteModelOut = {
    /**
     * The ID of the deleted model.
     */
    id: string;
    /**
     * The object type that was deleted
     */
    object?: string | undefined;
    /**
     * The deletion status
     */
    deleted?: boolean | undefined;
};
/** @internal */
export declare const DeleteModelOut$inboundSchema: z.ZodType<DeleteModelOut, z.ZodTypeDef, unknown>;
/** @internal */
export type DeleteModelOut$Outbound = {
    id: string;
    object: string;
    deleted: boolean;
};
/** @internal */
export declare const DeleteModelOut$outboundSchema: z.ZodType<DeleteModelOut$Outbound, z.ZodTypeDef, DeleteModelOut>;
/**
 * @internal
 * @deprecated This namespace will be removed in future versions. Use schemas and types that are exported directly from this module.
 */
export declare namespace DeleteModelOut$ {
    /** @deprecated use `DeleteModelOut$inboundSchema` instead. */
    const inboundSchema: z.ZodType<DeleteModelOut, z.ZodTypeDef, unknown>;
    /** @deprecated use `DeleteModelOut$outboundSchema` instead. */
    const outboundSchema: z.ZodType<DeleteModelOut$Outbound, z.ZodTypeDef, DeleteModelOut>;
    /** @deprecated use `DeleteModelOut$Outbound` instead. */
    type Outbound = DeleteModelOut$Outbound;
}
//# sourceMappingURL=deletemodelout.d.ts.map