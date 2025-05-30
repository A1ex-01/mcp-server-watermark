import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFile } from "fs/promises";
import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import path from "path";
import fs from "fs";
// Define Zod schemas for validation
const allowedFolder = process.env.HT_ALLOWED_FOLDER;
const WatermarkPdfArgumentsSchema = z.object({
    needWatermarkFileName: z.string().default(""),
    watermarkText: z.string().default("mcp-server-watermark"),
});
// Create server instance
const server = new McpServer({
    name: "mcp-server-watermark",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
        resources: {},
    },
});
server.tool("watermark", "给PDF文件添加水印", { input: WatermarkPdfArgumentsSchema }, async (input) => {
    try {
        //给路径文件打水印
        const { input: { needWatermarkFileName, watermarkText }, } = input;
        // 打开 allowedFolder
        if (!allowedFolder) {
            throw new Error(`未设置允许的文件夹路径${JSON.stringify(process.env)}`);
        }
        // 检查输入和输出路径是否在允许的文件夹内
        const allowedFolderResolved = path.resolve(allowedFolder);
        // 找到 在 folder 中的  inputPathResolved 这个文件
        // 检查文件是否存在
        if (!fs.existsSync(allowedFolderResolved)) {
            throw new Error(`文件夹不存在: ${allowedFolderResolved}`);
        }
        // 构建完整的文件路径
        const inputPathResolved = path.join(allowedFolder, needWatermarkFileName);
        // 检查文件是否存在
        if (!fs.existsSync(inputPathResolved)) {
            throw new Error(`文件不存在: ${needWatermarkFileName}`);
        }
        // 检查文件是否为PDF
        if (!inputPathResolved.toLowerCase().endsWith(".pdf")) {
            throw new Error("只支持PDF文件");
        }
        // 这个文件打上 watermarkText 的 水印， 存到 该 folder 下， 命名加上 watermarked
        // // 读取PDF文件
        const pdfBytes = await readFile(inputPathResolved);
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
        // 生成输出文件名
        const fileName = path.basename(inputPathResolved, ".pdf");
        const outputFileName = `${fileName}-watermarked.pdf`;
        const finalOutputPath = path.join(allowedFolderResolved, outputFileName);
        // 保存修改后的PDF
        const modifiedPdfBytes = await pdfDoc.save();
        await fs.promises.writeFile(finalOutputPath, modifiedPdfBytes);
        return {
            content: [
                {
                    type: "text",
                    text: `水印已成功添加到文件: ${finalOutputPath}`,
                },
            ],
        };
    }
    catch (error) {
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
});
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
