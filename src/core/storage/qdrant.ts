import { QdrantClient } from "@qdrant/js-client-rest";
import { env } from "../config/env";

export const qdrant = new QdrantClient({ url: env.QDRANT_URL });

export const createCollectionIfMissing = async (vectorSize = 384) => {
  const name = env.QDRANT_COLLECTION;
  const collection = await qdrant.getCollections();
  const exists = collection.collections.some((c) => c.name == name);
  if (!exists) {
    await qdrant.createCollection(name, {
      vectors: {
        size: vectorSize,
        distance: "Cosine",
      },
    });
  }
  return qdrant.getCollection(name);
};

export const getCollection = () => {
  return qdrant.getCollection(env.QDRANT_COLLECTION);
};

export const listCollections = () => {
  return qdrant.getCollections();
};
