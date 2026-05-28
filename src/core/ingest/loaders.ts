import fs from "fs/promises";
import pdf from "pdf-parse-new";

export async function loadTextFile(filePath: string): Promise<string> {
  return await fs.readFile(filePath, "utf-8");
}

export interface PdfPage {
  page: number;
  text: string;
}

export async function loadPdfPages(filePath: string): Promise<PdfPage[]> {
  const dataBuffer = await fs.readFile(filePath);

  const pages: PdfPage[] = [];

  await pdf(dataBuffer, {
    pagerender: (pageData: any) => {
      return pageData.getTextContent().then((textContent: any) => {
        const text = textContent.items
          .map((item: any) => item.str)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();

        pages.push({
          page: pages.length + 1, 
          text: text,
        });

        return text;
      });
    },
  });

  return pages;
}
