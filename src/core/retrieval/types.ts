export interface RetrievalChunk {
  id: string;
  score: number;
  text: string;
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

export interface RetrieveOptions {
  query: string;
  topK?: number;
  filterFilePath?: string;
  filter?: {
    source_id?: string;
    file_path?: string;
    tags?: string[];
  };
  includeDedupe?: boolean;
}
