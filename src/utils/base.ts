import { ColorTypes, degrees, StandardFonts, PDFDocument } from "pdf-lib";
export async function doWatermarkPDF(
  pdfBytes: ArrayBuffer,
  config: {
    watermarkText: string;
  }
) {
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
