import { existsSync, writeFileSync } from "fs";
import path from "path";
import { ColorTypes, degrees, PDFDocument, StandardFonts } from "pdf-lib";
import { z } from "zod";
export const WatermarkPdfArgumentsSchemaInput = z.object({
    needWatermarkUrl: z.string().default(""),
    watermarkText: z.string().default("mcp-server-watermark"),
});
// 通过本地目录，读取本地目录的文件，对本地目录中的某一PDF文件添加水印
export const toolCallbackFn = async (input, env) => {
    const { allowedFolder } = env;
    try {
        //给路径文件打水印
        const { input: { needWatermarkUrl, watermarkText }, } = input;
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
        // 获取线上文件
        // 从URL下载PDF文件
        const response = await fetch(needWatermarkUrl);
        if (!response.ok) {
            throw new Error(`下载文件失败: ${response.statusText}`);
        }
        // 获取文件名
        const contentDisposition = response.headers.get("content-disposition");
        let fileName = "downloaded.pdf";
        if (contentDisposition) {
            const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
            if (matches != null && matches[1]) {
                fileName = matches[1].replace(/['"]/g, "");
            }
        }
        // 将文件保存到本地
        const pdfBytes = await response.arrayBuffer();
        const inputPathResolved = path.join(allowedFolderResolved, fileName);
        // await writeFileSync(inputPathResolved, Buffer.from(pdfBytes));
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
                color: { type: ColorTypes.RGB, red: 0.7, green: 0.7, blue: 0.7 },
                opacity: 0.3,
                rotate: degrees(45),
            });
        });
        // 生成输出文件名
        const localFileName = path.basename(inputPathResolved, ".pdf");
        const outputFileName = `${localFileName}-watermarked.pdf`;
        const finalOutputPath = path.join(allowedFolderResolved, outputFileName);
        // 保存修改后的PDF
        const modifiedPdfBytes = await pdfDoc.save();
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
