import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ShopifyGraphQLClient } from "../utils/graphql-client.js";

export function registerFileTools(server: McpServer, client: ShopifyGraphQLClient) {
  // Get Files
  server.registerTool(
    "get_files",
    {
      description: "Fetch files uploaded to the store (images, videos, PDFs, etc.)",
      inputSchema: {
        first: z.number().min(1).max(250).optional().describe("Number of files to fetch (1-250, default: 50)"),
        after: z.string().optional().describe("Cursor for pagination"),
        query: z.string().optional().describe("Filter query (e.g., 'filename:image', 'mimeType:image/*')"),
        sortKey: z.enum(["CREATED_AT", "FILENAME", "ID"]).optional().describe("Field to sort by"),
        reverse: z.boolean().optional().describe("Reverse the sort order"),
      },
    },
    async ({ first = 50, after, query, sortKey = "CREATED_AT", reverse = true }) => {
      const graphqlQuery = `
        query GetFiles($first: Int!, $after: String, $query: String, $sortKey: FileSortKeys, $reverse: Boolean) {
          files(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
            edges {
              node {
                id
                alt
                createdAt
                updatedAt
                filename
                mimeType
                originalFileSize
                fileStatus
                preview {
                  image {
                    id
                    url
                    altText
                    width
                    height
                  }
                }
                ... on MediaImage {
                  image {
                    id
                    url
                    altText
                    width
                    height
                  }
                }
                ... on Video {
                  sources {
                    url
                    mimeType
                    width
                    height
                  }
                  originalSource {
                    url
                    mimeType
                    width
                    height
                  }
                }
                ... on GenericFile {
                  url
                }
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
        const result = await client.execute(graphqlQuery, { first, after, query, sortKey, reverse });
        
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

  // Get File
  server.registerTool(
    "get_file",
    {
      description: "Fetch a specific file by ID",
      inputSchema: {
        id: z.string().describe("File ID (e.g., 'gid://shopify/MediaImage/123456789')"),
      },
    },
    async ({ id }) => {
      const graphqlQuery = `
        query GetFile($id: ID!) {
          node(id: $id) {
            id
            ... on MediaImage {
              alt
              createdAt
              updatedAt
              filename
              mimeType
              originalFileSize
              fileStatus
              image {
                id
                url
                altText
                width
                height
              }
              preview {
                image {
                  id
                  url
                  altText
                  width
                  height
                }
              }
            }
            ... on Video {
              alt
              createdAt
              updatedAt
              filename
              mimeType
              originalFileSize
              fileStatus
              sources {
                url
                mimeType
                width
                height
              }
              originalSource {
                url
                mimeType
                width
                height
              }
              preview {
                image {
                  id
                  url
                  altText
                  width
                  height
                }
              }
            }
            ... on GenericFile {
              alt
              createdAt
              updatedAt
              filename
              mimeType
              originalFileSize
              fileStatus
              url
              preview {
                image {
                  id
                  url
                  altText
                  width
                  height
                }
              }
            }
          }
        }
      `;

      try {
        const result = await client.execute(graphqlQuery, { id });
        
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

  // Create File (Staged Upload)
  server.registerTool(
    "create_staged_upload",
    {
      description: "Create a staged upload target for file upload",
      inputSchema: {
        filename: z.string().describe("Name of the file to upload"),
        mimeType: z.string().describe("MIME type of the file (e.g., 'image/jpeg', 'video/mp4')"),
        resource: z.enum(["IMAGE", "VIDEO", "MODEL_3D", "FILE"]).describe("Type of resource"),
        fileSize: z.number().describe("Size of the file in bytes"),
      },
    },
    async ({ filename, mimeType, resource, fileSize }) => {
      const mutation = `
        mutation StagedUploadsCreate($input: [StagedUploadInput!]!) {
          stagedUploadsCreate(input: $input) {
            stagedTargets {
              url
              resourceUrl
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

      const input = [{
        filename,
        mimeType,
        resource,
        fileSize,
      }];

      try {
        const result = await client.execute(mutation, { input });
        
        if (result.errors) {
          return {
            content: [{ type: "text", text: `GraphQL Errors: ${JSON.stringify(result.errors, null, 2)}` }],
          };
        }

        const data = result.data as any;
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify({
              stagedTargets: data?.stagedUploadsCreate?.stagedTargets,
              userErrors: data?.stagedUploadsCreate?.userErrors,
              note: "Use the stagedTargets.url and parameters to upload your file via HTTP POST, then use the returned URL with create_file."
            }, null, 2) 
          }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        };
      }
    }
  );

  // Create File from URL
  server.registerTool(
    "create_file",
    {
      description: "Create a file from a URL (after staged upload or external URL)",
      inputSchema: {
        originalSource: z.string().describe("URL of the uploaded file"),
        filename: z.string().describe("Filename"),
        mimeType: z.string().describe("MIME type"),
        contentType: z.enum(["IMAGE", "VIDEO", "MODEL_3D", "FILE"]).describe("Content type"),
        alt: z.string().optional().describe("Alt text for accessibility"),
      },
    },
    async ({ originalSource, filename, mimeType, contentType, alt }) => {
      const mutation = `
        mutation FileCreate($files: [FileCreateInput!]!) {
          fileCreate(files: $files) {
            files {
              id
              alt
              createdAt
              filename
              mimeType
              fileStatus
              ... on MediaImage {
                image {
                  id
                  url
                  altText
                }
              }
              ... on Video {
                sources {
                  url
                  mimeType
                }
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const files = [{
        originalSource,
        filename,
        mimeType,
        contentType,
        alt,
      }];

      try {
        const result = await client.execute(mutation, { files });
        
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

  // Update File
  server.registerTool(
    "update_file",
    {
      description: "Update file metadata (alt text)",
      inputSchema: {
        id: z.string().describe("File ID"),
        alt: z.string().describe("New alt text"),
      },
    },
    async ({ id, alt }) => {
      const mutation = `
        mutation FileUpdate($input: FileInput!) {
          fileUpdate(input: $input) {
            file {
              id
              alt
              updatedAt
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const input = { id, alt };

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

  // Delete File
  server.registerTool(
    "delete_file",
    {
      description: "Delete a file",
      inputSchema: {
        id: z.string().describe("File ID to delete"),
      },
    },
    async ({ id }) => {
      const mutation = `
        mutation FileDelete($input: FileDeleteInput!) {
          fileDelete(input: $input) {
            deletedFileIds
            userErrors {
              field
              message
            }
          }
        }
      `;

      const input = { id };

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
}
