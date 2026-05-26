import fs from "fs/promises";
// استفاده از Namespace Import طبق تاکید مستندات برای جلوگیری از خطای Constructor
import * as PdfParse from 'pdf-parse-new';

export async function loadTextFile(filePath: string): Promise<string> {
  return await fs.readFile(filePath, "utf-8");
}

export async function loadPdfFile(filePath: string): Promise<string> {
  try {
    const dataBuffer = await fs.readFile(filePath);

    // ۱. ایجاد اینستنس از SmartPDFParser برای بهینه‌سازی خودکار
    // این بخش مشکل Worker در Next.js را به صورت داخلی حل می‌کند
    const parser = new PdfParse.SmartPDFParser({
      oversaturationFactor: 2.0, // استفاده حداکثری از CPU
      enableFastPath: true       // سرعت ۵۰ برابری برای فایل‌های کوچک
    });

    // ۲. پارس کردن فایل
    const result = await parser.parse(dataBuffer);

    if (!result || !result.text) {
      throw new Error("no content");
    }

    console.log(`✅ PDF Parsed: ${result.numpages} pages using ${result._meta?.method}`);
    
    return result.text;
  } catch (error: any) {
    console.error(`❌ Error parsing PDF at ${filePath}:`, error.message);
    throw error;
  }
}
