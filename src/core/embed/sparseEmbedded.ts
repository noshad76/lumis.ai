import { AutoTokenizer } from "@xenova/transformers";

// لود کردن توکنایزر (در محیط سرور کش می‌شود)
let tokenizer: any = null;

export async function getSparseEmbedding(
  text: string,
): Promise<{ indices: number[]; values: number[] }> {
  if (!tokenizer) {
    // استفاده از یک توکنایزر استاندارد مثل BERT/RoBERTa
    tokenizer = await AutoTokenizer.from_pretrained(
      "Xenova/bert-base-multilingual-cased",
    );
  }

  // ۱. توکنایز کردن متن به Token IDها (این همان چیزی است که دنبالش بودی)
  const { input_ids } = await tokenizer(text, {
    padding: false,
    truncation: true,
  });

  const ids = input_ids.data; // این‌ها آیدی‌های استاندارد لغت‌نامه BERT هستند
  const tokenCounts: Record<number, number> = {};

  // ۲. محاسبه فراوانی (TF) روی Token IDهای واقعی مدل
  for (const id of ids) {
    const idNum = Number(id);
    // حذف توکن‌های کنترلی (مثل [CLS], [SEP], [PAD])
    if (idNum <= 103) continue;

    tokenCounts[idNum] = (tokenCounts[idNum] || 0) + 1;
  }

  const indices: number[] = [];
  const values: number[] = [];

  for (const [id, count] of Object.entries(tokenCounts)) {
    indices.push(parseInt(id));
    // استفاده از Log-scaling برای وزن‌دهی
    values.push(Math.log1p(count));
  }

  return { indices, values };
}
