import { ColorTypes, degrees, PDFDocument, StandardFonts } from "pdf-lib";
import { z } from "zod";
export const WatermarkPdfArgumentsSchemaInput = z.object({
    needWatermarkUrl: z.string().default(""),
    watermarkText: z.string().default("mcp-server-watermark"),
});
async function doWatermarkPDF(pdfBytes, config) {
    const { watermarkText } = config;
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
    // 保存修改后的PDF
    const modifiedPdfBytes = await pdfDoc.save();
    return modifiedPdfBytes;
}
// 通过本地目录，读取本地目录的文件，对本地目录中的某一PDF文件添加水印
export const toolCallbackFn = async (input) => {
    try {
        const { input: { needWatermarkUrl, watermarkText }, } = input;
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
