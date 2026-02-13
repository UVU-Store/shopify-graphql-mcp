import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerPackingSlipTemplateTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Packing Slip Templates
  server.registerTool(
    "get_packing_slip_templates",
    {
      description: "Fetch packing slip templates",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of templates to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
      },
    },
    async ({ first = 50, after }) => {
      const query = `
        query GetPackingSlipTemplates($first: Int!, $after: String) {
          packingSlipTemplates(first: $first, after: $after) {
            edges {
              node {
                id
                name
                subject
                body
                createdAt
                updatedAt
              }
              cursor
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
            }
          }
        }
      `;

      try {
        const result = await client.execute(query, { first, after });
        
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

  // Create Packing Slip Template
  server.registerTool(
    "create_packing_slip_template",
    {
      description: "Create a new packing slip template",
      inputSchema: {
        name: z.string().describe("Template name"),
        subject: z.string().describe("Email subject"),
        body: z.string().describe("Template body (Liquid)"),
      },
    },
    async ({ name, subject, body }) => {
      const mutation = `
        mutation PackingSlipTemplateCreate($input: PackingSlipTemplateInput!) {
          packingSlipTemplateCreate(input: $input) {
            packingSlipTemplate {
              id
              name
              subject
              body
              createdAt
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const input = { name, subject, body };

      try {
        const result = await client.execute(mutation, { input });
        
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

  // Update Packing Slip Template
  server.registerTool(
    "update_packing_slip_template",
    {
      description: "Update an existing packing slip template",
      inputSchema: {
        id: z.string().describe("Template ID"),
        name: z.string().optional().describe("Template name"),
        subject: z.string().optional().describe("Email subject"),
        body: z.string().optional().describe("Template body (Liquid)"),
      },
    },
    async ({ id, name, subject, body }) => {
      const mutation = `
        mutation PackingSlipTemplateUpdate($id: ID!, $input: PackingSlipTemplateInput!) {
          packingSlipTemplateUpdate(id: $id, input: $input) {
            packingSlipTemplate {
              id
              name
              subject
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

      const input: Record<string, unknown> = {};
      if (name) input.name = name;
      if (subject) input.subject = subject;
      if (body) input.body = body;

      try {
        const result = await client.execute(mutation, { id, input });
        
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

  // Delete Packing Slip Template
  server.registerTool(
    "delete_packing_slip_template",
    {
      description: "Delete a packing slip template",
      inputSchema: {
        id: z.string().describe("Template ID to delete"),
      },
    },
    async ({ id }) => {
      const mutation = `
        mutation PackingSlipTemplateDelete($id: ID!) {
          packingSlipTemplateDelete(id: $id) {
            deletedPackingSlipTemplateId
            userErrors {
              field
              message
            }
          }
        }
      `;

      try {
        const result = await client.execute(mutation, { id });
        
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
