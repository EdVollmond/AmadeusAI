import type { PipelineType } from "../pipelines.js";
import type { ModelDataMinimal } from "./types.js";
export declare const snippetConversational: (model: ModelDataMinimal, accessToken: string) => string;
export declare const snippetZeroShotClassification: (model: ModelDataMinimal) => string;
export declare const snippetZeroShotImageClassification: (model: ModelDataMinimal) => string;
export declare const snippetBasic: (model: ModelDataMinimal) => string;
export declare const snippetFile: (model: ModelDataMinimal) => string;
export declare const snippetTextToImage: (model: ModelDataMinimal) => string;
export declare const snippetTabular: (model: ModelDataMinimal) => string;
export declare const snippetTextToAudio: (model: ModelDataMinimal) => string;
export declare const snippetDocumentQuestionAnswering: (model: ModelDataMinimal) => string;
export declare const pythonSnippets: Partial<Record<PipelineType, (model: ModelDataMinimal, accessToken: string) => string>>;
export declare function getPythonInferenceSnippet(model: ModelDataMinimal, accessToken: string): string;
export declare function hasPythonInferenceSnippet(model: ModelDataMinimal): boolean;
//# sourceMappingURL=python.d.ts.map