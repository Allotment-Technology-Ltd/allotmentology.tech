export class AiNotConfiguredError extends Error {
  readonly code = "AI_NOT_CONFIGURED";
  constructor(message = "AI provider is not configured (set AI_API_KEY or OPENAI_API_KEY).") {
    super(message);
    this.name = "AiNotConfiguredError";
  }
}

export class AiParseError extends Error {
  readonly code = "AI_PARSE_ERROR";
  constructor(
    message: string,
    readonly rawText?: string,
  ) {
    super(message);
    this.name = "AiParseError";
  }
}

export class AiProviderError extends Error {
  readonly code = "AI_PROVIDER_ERROR";
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}
