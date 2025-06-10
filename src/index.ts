import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
// @ts-ignore
import watermarkByOnline from "./tools/watermark-by-online.js";
import watermarkLinkToLink from "./tools/watermark-link-to-link.js";
import watermarkByLocal from "./tools/watermark-by-local.js";
import scanFolder from "./tools/scan-folder.js";
export interface ToolCallbackEnv {
  allowedFolder: string;
}

const allowedFolder = process.env.HT_ALLOWED_FOLDER as string;

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
  "scan-folder",
  "通过设置的folder，扫描指定目录下的PDF文件，并返回PDF文件列表",
  { input: scanFolder.ScanFolderArgumentsSchemaInput },
  async (input) => {
    return await scanFolder.toolCallbackFn({
      allowedFolder: allowedFolder,
    });
  }
);

// @ts-ignore
server.tool(
  "watermark-local",
  "对本地目录中的某一PDF文件添加水印",
  { input: watermarkByLocal.WatermarkPdfArgumentsSchemaInput },
  async (input) => {
    return await watermarkByLocal.toolCallbackFn(input, {
      allowedFolder: allowedFolder,
    });
  }
);
// @ts-ignore
server.tool(
  "watermark-link-to-link",
  "读取在线文件地址，对在线文件地址的PDF文件添加水印，保存成在线地址",
  { input: watermarkLinkToLink.WatermarkPdfArgumentsSchemaInput },
  async (input) => {
    return await watermarkLinkToLink.toolCallbackFn(input);
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
