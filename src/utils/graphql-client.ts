import { exec } from "child_process";
import { promisify } from "util";
import { GraphQLResponse, ShopifyConfig } from "../types/index.js";

const execAsync = promisify(exec);

export class ShopifyGraphQLClient {
  private config: ShopifyConfig;

  constructor() {
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    const storeUrl = process.env.SHOPIFY_STORE_URL;
    const apiUrl = process.env.SHOPIFY_STORE_API_URL;

    if (!accessToken) {
      throw new Error("Missing required environment variable: SHOPIFY_ACCESS_TOKEN");
    }

    if (!storeUrl) {
      throw new Error("Missing required environment variable: SHOPIFY_STORE_URL");
    }

    if (!apiUrl) {
      throw new Error("Missing required environment variable: SHOPIFY_STORE_API_URL");
    }

    this.config = {
      accessToken,
      storeUrl,
      apiUrl,
    };
  }

  async execute<T>(query: string, variables?: Record<string, unknown>): Promise<GraphQLResponse<T>> {
    const payload = JSON.stringify({
      query: query.trim(),
      variables: variables || {},
    });

    // Escape single quotes for shell safety
    const escapedPayload = payload.replace(/'/g, "'\"'\"'");

    const curlCommand = `curl -s -X POST "${this.config.apiUrl}" \
      -H "Content-Type: application/json" \
      -H "X-Shopify-Access-Token: ${this.config.accessToken}" \
      -d '${escapedPayload}'`;

    try {
      const { stdout, stderr } = await execAsync(curlCommand);
      
      if (stderr) {
        console.error("cURL stderr:", stderr);
      }

      const response = JSON.parse(stdout);
      
      // Handle Shopify API errors
      if (response.errors) {
        return { errors: response.errors };
      }

      return response;
    } catch (error) {
      console.error("GraphQL request failed:", error);
      throw new Error(`GraphQL request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  getConfig(): ShopifyConfig {
    return { ...this.config };
  }
}
