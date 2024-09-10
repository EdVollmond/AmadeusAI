import type { PipelineType } from "../pipelines.js";
import type { ModelDataMinimal } from "./types.js";
export declare const snippetBasic: (model: ModelDataMinimal, accessToken: string) => string;
export declare const snippetTextGeneration: (model: ModelDataMinimal, accessToken: string) => string;
export declare const snippetZeroShotClassification: (model: ModelDataMinimal, accessToken: string) => string;
export declare const snippetTextToImage: (model: ModelDataMinimal, accessToken: string) => string;
export declare const snippetTextToAudio: (model: ModelDataMinimal, accessToken: string) => string;
export declare const snippetFile: (model: ModelDataMinimal, accessToken: string) => string;
export declare const jsSnippets: Partial<Record<PipelineType, (model: ModelDataMinimal, accessToken: string) => string>>;
export declare function getJsInferenceSnippet(model: ModelDataMinimal, accessToken: string): string;
export declare function hasJsInferenceSnippet(model: ModelDataMinimal): boolean;
//# sourceMappingURL=js.d.ts.map