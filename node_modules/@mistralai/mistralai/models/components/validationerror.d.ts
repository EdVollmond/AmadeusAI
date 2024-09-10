import * as z from "zod";
export type Loc = string | number;
export type ValidationError = {
    loc: Array<string | number>;
    msg: string;
    type: string;
};
/** @internal */
export declare const Loc$inboundSchema: z.ZodType<Loc, z.ZodTypeDef, unknown>;
/** @internal */
export type Loc$Outbound = string | number;
/** @internal */
export declare const Loc$outboundSchema: z.ZodType<Loc$Outbound, z.ZodTypeDef, Loc>;
/**
 * @internal
 * @deprecated This namespace will be removed in future versions. Use schemas and types that are exported directly from this module.
 */
export declare namespace Loc$ {
    /** @deprecated use `Loc$inboundSchema` instead. */
    const inboundSchema: z.ZodType<Loc, z.ZodTypeDef, unknown>;
    /** @deprecated use `Loc$outboundSchema` instead. */
    const outboundSchema: z.ZodType<Loc$Outbound, z.ZodTypeDef, Loc>;
    /** @deprecated use `Loc$Outbound` instead. */
    type Outbound = Loc$Outbound;
}
/** @internal */
export declare const ValidationError$inboundSchema: z.ZodType<ValidationError, z.ZodTypeDef, unknown>;
/** @internal */
export type ValidationError$Outbound = {
    loc: Array<string | number>;
    msg: string;
    type: string;
};
/** @internal */
export declare const ValidationError$outboundSchema: z.ZodType<ValidationError$Outbound, z.ZodTypeDef, ValidationError>;
/**
 * @internal
 * @deprecated This namespace will be removed in future versions. Use schemas and types that are exported directly from this module.
 */
export declare namespace ValidationError$ {
    /** @deprecated use `ValidationError$inboundSchema` instead. */
    const inboundSchema: z.ZodType<ValidationError, z.ZodTypeDef, unknown>;
    /** @deprecated use `ValidationError$outboundSchema` instead. */
    const outboundSchema: z.ZodType<ValidationError$Outbound, z.ZodTypeDef, ValidationError>;
    /** @deprecated use `ValidationError$Outbound` instead. */
    type Outbound = ValidationError$Outbound;
}
//# sourceMappingURL=validationerror.d.ts.map