import type { PipelineType } from "../pipelines.js";
import type { ModelDataMinimal } from "./types.js";
export declare const snippetBasic: (model: ModelDataMinimal, accessToken: string) => string;
export declare const snippetTextGeneration: (model: ModelDataMinimal, accessToken: string) => string;
export declare const snippetZeroShotClassification: (model: ModelDataMinimal, accessToken: string) => string;
export declare const snippetFile: (model: ModelDataMinimal, accessToken: string) => string;
export declare const curlSnippets: Partial<Record<PipelineType, (model: ModelDataMinimal, accessToken: string) => string>>;
export declare function getCurlInferenceSnippet(model: ModelDataMinimal, accessToken: string): string;
export declare function hasCurlInferenceSnippet(model: Pick<ModelDataMinimal, "pipeline_tag">): boolean;
//# sourceMappingURL=curl.d.ts.map