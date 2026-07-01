import * as pi from "@earendil-works/pi-ai";

export interface ModelProviderGroup {
  id: string;
  name: string;
  models: readonly pi.Model<pi.Api>[];
  apiKeyDetected?: boolean;
  apiKey?: string;
  /** Model ids the user has disabled. Everything not listed is enabled. */
  disabledModels?: string[];
  websiteLink?: string;
  websiteURL?: string;
  apiKeyURL?: string;
  iconURL?: string;
}
