import * as z from "zod";
export type DeleteFileOut = {
    /**
     * The ID of the deleted file.
     */
    id: string;
    /**
     * The object type that was deleted
     */
    object: string;
    /**
     * The deletion status.
     */
    deleted: boolean;
};
/** @internal */
export declare const DeleteFileOut$inboundSchema: z.ZodType<DeleteFileOut, z.ZodTypeDef, unknown>;
/** @internal */
export type DeleteFileOut$Outbound = {
    id: string;
    object: string;
    deleted: boolean;
};
/** @internal */
export declare const DeleteFileOut$outboundSchema: z.ZodType<DeleteFileOut$Outbound, z.ZodTypeDef, DeleteFileOut>;
/**
 * @internal
 * @deprecated This namespace will be removed in future versions. Use schemas and types that are exported directly from this module.
 */
export declare namespace DeleteFileOut$ {
    /** @deprecated use `DeleteFileOut$inboundSchema` instead. */
    const inboundSchema: z.ZodType<DeleteFileOut, z.ZodTypeDef, unknown>;
    /** @deprecated use `DeleteFileOut$outboundSchema` instead. */
    const outboundSchema: z.ZodType<DeleteFileOut$Outbound, z.ZodTypeDef, DeleteFileOut>;
    /** @deprecated use `DeleteFileOut$Outbound` instead. */
    type Outbound = DeleteFileOut$Outbound;
}
//# sourceMappingURL=deletefileout.d.ts.map