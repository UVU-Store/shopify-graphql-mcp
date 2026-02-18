import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerBulkOperationTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Create Staged Upload
  server.registerTool(
    "create_staged_upload",
    {
      description: "Create staged upload targets for file uploads. Use this for uploading large files, media files, or bulk import data before processing.",
      inputSchema: {
        files: z.array(z.object({
          filename: z.string().describe("File name"),
          mimeType: z.string().describe("MIME type (e.g., 'image/jpeg', 'text/csv')"),
          resource: z.enum(["IMAGE", "VIDEO", "MODEL_3D", "PRODUCT_CSV", "COLLECTION_CSV", "BULK_OPERATIONS"]).describe("Resource type"),
          fileSize: z.number().optional().describe("File size in bytes (required for VIDEO and MODEL_3D)"),
        })).describe("Files to upload"),
      },
    },
    async ({ files }) => {
      const mutation = `
        mutation StagedUploadsCreate($input: [StagedUploadInput!]!) {
          stagedUploadsCreate(input: $input) {
            stagedTargets {
              resourceUrl
              url
              parameters {
                name
                value
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const input = files.map(f => ({
        filename: f.filename,
        mimeType: f.mimeType,
        resource: f.resource,
        ...(f.fileSize && { fileSize: f.fileSize }),
      }));

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

  // List Bulk Operations
  server.registerTool(
    "list_bulk_operations",
    {
      description: "List all bulk operations for the app. Results include status, type, and URLs to result files when complete.",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of operations to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        status: z.enum(["CREATED", "RUNNING", "COMPLETED", "CANCELING", "CANCELED", "FAILED"]).optional().describe("Filter by status"),
      },
    },
    async ({ first = 50, after, status }) => {
      const query = `
        query GetBulkOperations($first: Int!, $after: String, $query: String) {
          bulkOperations(first: $first, after: $after, query: $query) {
            edges {
              node {
                id
                status
                type
                createdAt
                completedAt
                objectCount
                fileSize
                url
                partialDataUrl
                errorCode
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
        const result = await client.execute(query, { 
          first, 
          after,
          query: status ? `status:${status}` : undefined
        });

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

  // Get Bulk Operation
  server.registerTool(
    "get_bulk_operation",
    {
      description: "Get details of a specific bulk operation by ID",
      inputSchema: {
        id: z.string().describe("Bulk operation ID (e.g., 'gid://shopify/BulkOperation/123456789')"),
      },
    },
    async ({ id }) => {
      const query = `
        query GetBulkOperation($id: ID!) {
          bulkOperation(id: $id) {
            id
            status
            type
            createdAt
            completedAt
            objectCount
            fileSize
            url
            partialDataUrl
            errorCode
          }
        }
      `;

      try {
        const result = await client.execute(query, { id });

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

  // Run Bulk Query
  server.registerTool(
    "run_bulk_query",
    {
      description: "Run a bulk query operation to fetch large amounts of data asynchronously. Results are returned as a JSONL file. Supports up to 5 connections with max nesting depth of 2 levels. Results available for 7 days after completion.",
      inputSchema: {
        query: z.string().describe("GraphQL query to execute in bulk. Must include at least one connection field."),
        groupObjects: z.boolean().optional().describe("Group objects under their parent objects in JSONL output (slower, increases timeout risk)"),
      },
    },
    async ({ query, groupObjects = false }) => {
      const mutation = `
        mutation BulkOperationRunQuery($query: String!, $groupObjects: Boolean!) {
          bulkOperationRunQuery(query: $query, groupObjects: $groupObjects) {
            bulkOperation {
              id
              status
              type
              createdAt
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      try {
        const result = await client.execute(mutation, { query, groupObjects });

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

  // Run Bulk Mutation
  server.registerTool(
    "run_bulk_mutation",
    {
      description: "Run a bulk mutation operation to import data asynchronously. Each line in the JSONL file is processed as a separate mutation execution. Upload file using staged uploads first.",
      inputSchema: {
        mutation: z.string().describe("GraphQL mutation to execute for each line in the file"),
        stagedUploadPath: z.string().describe("Staged upload path from file upload (e.g., 'tmp/1234567890/bulk_op_vars.jsonl')"),
        clientIdentifier: z.string().optional().describe("Optional identifier for querying the operation later"),
      },
    },
    async ({ mutation: mutationString, stagedUploadPath, clientIdentifier }) => {
      const mutation = `
        mutation BulkOperationRunMutation($mutation: String!, $stagedUploadPath: String!, $clientIdentifier: String) {
          bulkOperationRunMutation(
            mutation: $mutation, 
            stagedUploadPath: $stagedUploadPath,
            clientIdentifier: $clientIdentifier
          ) {
            bulkOperation {
              id
              status
              type
              createdAt
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      try {
        const result = await client.execute(mutation, { 
          mutation: mutationString, 
          stagedUploadPath,
          clientIdentifier 
        });

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

  // Cancel Bulk Operation
  server.registerTool(
    "cancel_bulk_operation",
    {
      description: "Cancel a running bulk operation. There may be a short delay from when cancellation starts until the operation is actually canceled.",
      inputSchema: {
        id: z.string().describe("Bulk operation ID to cancel"),
      },
    },
    async ({ id }) => {
      const mutation = `
        mutation BulkOperationCancel($id: ID!) {
          bulkOperationCancel(id: $id) {
            bulkOperation {
              id
              status
              type
            }
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
