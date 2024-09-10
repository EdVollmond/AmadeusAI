import * as z from "zod";
export type FilesApiRoutesDeleteFileRequest = {
    fileId: string;
};
/** @internal */
export declare const FilesApiRoutesDeleteFileRequest$inboundSchema: z.ZodType<FilesApiRoutesDeleteFileRequest, z.ZodTypeDef, unknown>;
/** @internal */
export type FilesApiRoutesDeleteFileRequest$Outbound = {
    file_id: string;
};
/** @internal */
export declare const FilesApiRoutesDeleteFileRequest$outboundSchema: z.ZodType<FilesApiRoutesDeleteFileRequest$Outbound, z.ZodTypeDef, FilesApiRoutesDeleteFileRequest>;
/**
 * @internal
 * @deprecated This namespace will be removed in future versions. Use schemas and types that are exported directly from this module.
 */
export declare namespace FilesApiRoutesDeleteFileRequest$ {
    /** @deprecated use `FilesApiRoutesDeleteFileRequest$inboundSchema` instead. */
    const inboundSchema: z.ZodType<FilesApiRoutesDeleteFileRequest, z.ZodTypeDef, unknown>;
    /** @deprecated use `FilesApiRoutesDeleteFileRequest$outboundSchema` instead. */
    const outboundSchema: z.ZodType<FilesApiRoutesDeleteFileRequest$Outbound, z.ZodTypeDef, FilesApiRoutesDeleteFileRequest>;
    /** @deprecated use `FilesApiRoutesDeleteFileRequest$Outbound` instead. */
    type Outbound = FilesApiRoutesDeleteFileRequest$Outbound;
}
//# sourceMappingURL=filesapiroutesdeletefile.d.ts.map