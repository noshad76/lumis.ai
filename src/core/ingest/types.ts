export interface Document {
  id: string;
  text: string;
  metadata: {
    source_id: string;
    file_path: string;
    title: string;
    page?: number;
    section?: string;
    hash: string;
    extension: string;
  };
}

export interface Chunk extends Document {
  chunk_index: number;
}

export type chunkTextInput = {
  text: string;
  size?: number;
  overlap?: number;
};
export type IngestionStats = {
  totalFiles: number;
  processed: number;
  skipped: number;
  totalChunks: number;
};
