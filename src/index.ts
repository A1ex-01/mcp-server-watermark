import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { readFile, writeFile } from "fs/promises";
import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import path from "path";
import fs from "fs";
import { toolCallbackFn } from "./tools/watermark-by-local.js";
// Define Zod schemas for validation

export interface ToolCallbackEnv {
  allowedFolder: string;
}

const allowedFolder = process.env.HT_ALLOWED_FOLDER as string;
// 检查输入和输出路径是否在允许的文件夹内
// const allowedFolderResolved = path.resolve(allowedFolder);

// // 找到 在 folder 中的  inputPathResolved 这个文件
// // 检查文件是否存在
// if (!fs.existsSync(allowedFolderResolved)) {
//   throw new Error(`文件夹不存在: ${allowedFolderResolved}`);
// }
const WatermarkPdfArgumentsSchema = z.object({
  needWatermarkFileName: z.string().default(""),
  watermarkText: z.string().default("mcp-server-watermark"),
});

// Create server instance
const server = new McpServer(
  {
    name: "mcp-server-watermark",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);
// @ts-ignore
server.tool(
  "watermark",
  "给PDF文件添加水印",
  { input: WatermarkPdfArgumentsSchema },
  async (input) => {
    return await toolCallbackFn(input, {
      allowedFolder: allowedFolder,
    });
  }
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("mcp-server-watermark MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
