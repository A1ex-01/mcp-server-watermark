import { ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { existsSync, readFile, readFileSync, writeFileSync } from "fs";
import path from "path";
import { ColorTypes, degrees, PDFDocument, StandardFonts } from "pdf-lib";
import { z, ZodRawShape } from "zod";
import { doWatermarkPDF } from "../utils/base.js";
export const WatermarkPdfArgumentsSchemaInput = z.object({
  needWatermarkUrl: z.string().default(""),
  watermarkText: z.string().default("mcp-server-watermark"),
});

// 通过本地目录，读取本地目录的文件，对本地目录中的某一PDF文件添加水印
export const toolCallbackFn = async (input: {
  input: {
    needWatermarkUrl: string;
    watermarkText: string;
  };
}) => {
  try {
    const {
      input: { needWatermarkUrl, watermarkText },
    } = input;

    // 获取线上文件
    // 从URL下载PDF文件
    const response = await fetch(needWatermarkUrl);
    if (!response.ok) {
      throw new Error(`访问文件地址失败: ${response.statusText}`);
    }
    const pdfBytes = await response.arrayBuffer();
    const res = await doWatermarkPDF(pdfBytes, {
      watermarkText: watermarkText,
    });
    return {
      _meta: {},
      content: [
        {
          type: "text",
          text: `水印已成功打印: ${res.byteLength}`,
          _meta: {},
        },
      ],
    };
  } catch (error) {
    console.error("添加水印时出错:", error);
    return {
      _meta: {},
      content: [
        {
          type: "text",
          text: `添加水印失败: ${error}`,
          _meta: {},
        },
      ],
    };
  }
};

const config = {
  WatermarkPdfArgumentsSchemaInput,
  toolCallbackFn,
};

export default config;
