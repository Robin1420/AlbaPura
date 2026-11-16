-- Documentos PDF por producto: proceso de elaboración y manual de uso (se guardan en R2).
ALTER TABLE products ADD COLUMN process_doc text;
ALTER TABLE products ADD COLUMN usage_doc text;
