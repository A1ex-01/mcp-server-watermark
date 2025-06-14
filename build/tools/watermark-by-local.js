import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { z } from "zod";
import { doWatermarkPDF } from "../utils/base.js";
const WatermarkPdfArgumentsSchemaInput = z.object({
    needWatermarkFilePath: z.string().default(""),
    watermarkText: z.string().default("mcp-server-watermark"),
    exportFileName: z.string().default(""),
});
const toolCallbackFn = async (input, env) => {
    const { allowedFolder } = env;
    try {
        //给路径文件打水印
        const { input: { needWatermarkFilePath, watermarkText, exportFileName }, } = input;
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
        // 构建完整的文件路径
        const inputPathResolved = path.join(allowedFolder, needWatermarkFilePath);
        // 检查文件是否存在
        if (!existsSync(inputPathResolved)) {
            throw new Error(`文件不存在: ${needWatermarkFilePath}`);
        }
        // 检查文件是否为PDF
        if (!inputPathResolved.toLowerCase().endsWith(".pdf")) {
            throw new Error("只支持PDF文件");
        }
        // 这个文件打上 watermarkText 的 水印， 存到 该 folder 下， 命名加上 watermarked
        // // 读取PDF文件
        const pdfBytes = await readFileSync(inputPathResolved);
        const modifiedPdfBytes = await doWatermarkPDF(pdfBytes, {
            watermarkText: watermarkText,
        });
        // 生成输出文件名
        const fileName = path.basename(inputPathResolved, ".pdf");
        const fileFolder = path.dirname(needWatermarkFilePath);
        const endName = exportFileName ? exportFileName : `${fileName}-watermarked`;
        const outputFileName = `${fileFolder}/${endName}.pdf`;
        const finalOutputPath = path.join(allowedFolderResolved, outputFileName);
        // 保存修改后的PDF
        await writeFileSync(finalOutputPath, modifiedPdfBytes);
        return {
            _meta: {},
            content: [
                {
                    type: "text",
                    text: `水印已成功添加到文件: ${finalOutputPath}`,
                    _meta: {},
                },
            ],
        };
    }
    catch (error) {
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
