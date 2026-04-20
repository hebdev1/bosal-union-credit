
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS savings_product_id uuid REFERENCES savings_products(id);
;
