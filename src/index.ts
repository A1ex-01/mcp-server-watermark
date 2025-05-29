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
// Define Zod schemas for validation
const AlertsArgumentsSchema = z.object({
  state: z.string(),
});
const flomoApiUrl =
  "https://flomoapp.com/iwh/MTk1NDQwOA/d11c48be63ddbe6fe74d6a0ab2e645ca/";
const WatermarkPdfArgumentsSchema = z.object({
  inputPath: z.string().default("src/assets/test.pdf"),
  watermarkText: z.string().default("Confidential"),
  outputPath: z.string().default("src/assets/test_watermarked.pdf"),
});

// Create server instance
const server = new McpServer(
  {
    name: "mcp-server-watermark",
    version: "1.0.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);
server.tool(
  "watermark",
  "给PDF文件添加水印",
  { input: WatermarkPdfArgumentsSchema },
  async (input) => {
    try {
      //给路径文件打水印
      const {
        input: { inputPath, outputPath, watermarkText },
      } = input;

      // 转换为绝对路径
      const absoluteInputPath = path.resolve(inputPath);
      const absoluteOutputPath = path.resolve(outputPath);

      // 读取PDF文件
      const pdfBytes = await readFile(absoluteInputPath);

      // 加载PDF文档
      const pdfDoc = await PDFDocument.load(pdfBytes);

      // 获取所有页面
      const pages = pdfDoc.getPages();

      // 加载标准字体
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // 为每一页添加水印
      pages.forEach((page) => {
        const { width, height } = page.getSize();

        // 设置水印文本的样式
        page.drawText(watermarkText, {
          x: width / 2 - 100,
          y: height / 2,
          size: 50,
          font: font,
          color: rgb(0.7, 0.7, 0.7),
          opacity: 0.3,
          rotate: degrees(45),
        });
      });

      // 保存修改后的PDF
      const modifiedPdfBytes = await pdfDoc.save();
      await writeFile(absoluteOutputPath, modifiedPdfBytes);
      return {
        content: [
          {
            type: "text",
            text: `水印已成功添加到文件: ${absoluteOutputPath}`,
          },
        ],
      };
    } catch (error) {
      console.error("添加水印时出错:", error);
      return {
        content: [
          {
            type: "text",
            text: `添加水印失败: ${error}`,
          },
        ],
      };
    }
  }
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Weather MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
