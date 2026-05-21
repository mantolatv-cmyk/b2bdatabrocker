-- pgvector HNSW indexes for B2B Data Broker
-- Run this after prisma db push to create vector indexes

-- Index for vector_knowledge table (cosine distance)
CREATE INDEX IF NOT EXISTS idx_vector_knowledge_embedding 
ON vector_knowledge USING hnsw (embedding vector_cosine_ops);

-- Index for KnowledgeChunk table (cosine distance)
CREATE INDEX IF NOT EXISTS idx_knowledge_chunk_embedding 
ON "KnowledgeChunk" USING hnsw (embedding vector_cosine_ops);

-- Verify indexes
SELECT indexname, tablename FROM pg_indexes 
WHERE indexname LIKE '%embedding%';
