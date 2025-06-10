import { ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  existsSync,
  readdirSync,
  readFile,
  readFileSync,
  writeFileSync,
} from "fs";
import path from "path";
import { ColorTypes, degrees, PDFDocument, StandardFonts } from "pdf-lib";
import { z, ZodRawShape } from "zod";
import { ToolCallbackEnv } from "../index.js";
const ScanFolderArgumentsSchemaInput = z.object({});

const toolCallbackFn = async (env: ToolCallbackEnv) => {
  const { allowedFolder } = env;
  try {
    // 打开 allowedFolder
    if (!allowedFolder) {
      throw new Error(`未设置允许的文件夹路径${JSON.stringify(process.env)}`);
    }

    // 检查输入和输出路径是否在允许的文件夹内
    const allowedFolderResolved = path.resolve(allowedFolder);

    // 找到 在 folder 中的  inputPathResolved 这个文件
    // 检查文件是否存在
    if (!existsSync(allowedFolderResolved)) {
      throw new Error(`文件夹不存在: ${allowedFolderResolved}`);
    }

    // 获取文件夹下所有文件
    const files = readdirSync(allowedFolderResolved);
    // 递归获取所有文件
    const getAllFiles = (dir: string): string[] => {
      const files: string[] = [];
      const items = readdirSync(dir, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          files.push(...getAllFiles(fullPath));
        } else {
          files.push(fullPath);
        }
      }

      return files;
    };

    // 获取所有文件（包括子目录）
    const allFiles = getAllFiles(allowedFolderResolved);
    // 将完整路径转换为相对于 allowedFolder 的路径
    const fullFiles = allFiles.map((file) =>
      path.relative(allowedFolderResolved, file)
    );

    // 过滤出PDF文件
    const pdfFiles = fullFiles.filter((file) =>
      file.toLowerCase().endsWith(".pdf")
    );

    // 返回PDF文件列表
    return {
      _meta: {},
      content: [
        {
          type: "text",
          text: `文件夹中的PDF文件列表:\n${pdfFiles.join("\n")}`,
          _meta: {},
        },
      ],
    };
  } catch (error) {
    console.error("扫描时出错:", error);
    return {
      _meta: {},
      content: [
        {
          type: "text",
          text: `扫描时失败: ${error}`,
          _meta: {},
        },
      ],
    };
  }
};

const config = {
  ScanFolderArgumentsSchemaInput,
  toolCallbackFn,
};

export default config;
