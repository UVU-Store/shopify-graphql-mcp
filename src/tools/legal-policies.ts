import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerLegalPolicyTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Legal Policies
  server.registerTool(
    "get_legal_policies",
    {
      description: "Fetch legal policies for the store",
      inputSchema: {},
    },
    async () => {
      const query = `
        query GetLegalPolicies {
          shop {
            id
            name
            legalPolicies {
              id
              title
              handle
              body
              createdAt
              updatedAt
            }
          }
        }
      `;

      try {
        const result = await client.execute(query, {});
        
        if (result.errors) {
          return {
            content: [{ type: "text", text: `GraphQL Errors: ${JSON.stringify(result.errors, null, 2)}` }],
          };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  // Get Legal Policy
  server.registerTool(
    "get_legal_policy",
    {
      description: "Fetch a specific legal policy by handle",
      inputSchema: {
        handle: z.enum(["refund-policy", "privacy-policy", "terms-of-service", "terms-of-sale", "legal-notice", "shipping-policy"]).describe("Legal policy handle"),
      },
    },
    async ({ handle }) => {
      const query = `
        query GetLegalPolicy($handle: String!) {
          legalPolicy(handle: $handle) {
            id
            title
            handle
            body
            createdAt
            updatedAt
          }
        }
      `;

      try {
        const result = await client.execute(query, { handle });
        
        if (result.errors) {
          return {
            content: [{ type: "text", text: `GraphQL Errors: ${JSON.stringify(result.errors, null, 2)}` }],
          };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  // Update Legal Policy
  server.registerTool(
    "update_legal_policy",
    {
      description: "Update a legal policy",
      inputSchema: {
        handle: z.enum(["refund-policy", "privacy-policy", "terms-of-service", "terms-of-sale", "legal-notice", "shipping-policy"]).describe("Legal policy handle"),
        body: z.string().describe("Policy body content (HTML or plain text)"),
      },
    },
    async ({ handle, body }) => {
      const mutation = `
        mutation LegalPolicyUpdate($handle: LegalPolicyHandle!, $body: String!) {
          legalPolicyUpdate(handle: $handle, body: $body) {
            legalPolicy {
              id
              title
              handle
              body
              updatedAt
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      try {
        const result = await client.execute(mutation, { handle, body });
        
        if (result.errors) {
          return {
            content: [{ type: "text", text: `GraphQL Errors: ${JSON.stringify(result.errors, null, 2)}` }],
          };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );
}
