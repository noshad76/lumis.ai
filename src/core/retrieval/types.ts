export interface RetrievalChunk {
  id: string;
  score: number;
  text: string;
  dense_vector?: number[];
  metadata: {
    source_id: string;
    file_path: string;
    title: string;
    hash: string;
    extension: string;
    chunk_index: number;
    page?: number;
    section?: string;
    tags: string[];
  };
}

export interface RetrievalOptions {
  query: string;
  topK?: number;
  topN?: number;
  filter?: {
    source_id?: string;
    file_path?: string;
    tags?: string[];
  };
  includeDedupe?: boolean;
}