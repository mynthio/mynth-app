// This file was generated by [ts-rs](https://github.com/Aleph-Alpha/ts-rs). Do not edit this file manually.

export type MarketplaceApiProvider = { id: string, is_official: boolean, base_url: string, compatibility: string, auth_type: string, auth_config: string, models_sync_strategy: string, updated_at: string, created_at: string, published_at: string, };

export type MarketplaceApiProviderEndpoint = { id: string, display_name: string | null, type: string, path: string, method: string, request_template: string | null, json_request_schema: string | null, json_response_schema: string | null, streaming: boolean, priority: number | null, json_config: string | null, };

export type MarketplaceApiProviderModel = { id: string, name: string, display_name: string, max_input_tokens: number | null, input_price: number | null, output_price: number | null, tags: Array<string> | null, request_template: string | null, json_config: string | null, json_metadata_v1: string | null, };
