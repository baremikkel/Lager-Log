-- Loose fruit and vegetables commonly sold in Danish supermarkets. They have no barcode, so,
-- like products created in the app with "Varen har en stregkode" unticked, each one gets its
-- own id as product_barcode. All are put in the "Frugt og Grønt" category (created by setup.sql).
--
-- Safe to run again: a product is skipped if one with the same name (any case) already exists.
-- Run with:  npm run db:seed

WITH produce(name, ord) AS (
    SELECT * FROM unnest(ARRAY[
        -- Frugt
        'Æble', 'Pære', 'Banan', 'Appelsin', 'Blodappelsin', 'Clementin', 'Mandarin',
        'Citron', 'Lime', 'Grapefrugt', 'Pomelo', 'Kiwi', 'Mango', 'Ananas', 'Avocado',
        'Fersken', 'Fladfersken', 'Nektarin', 'Blomme', 'Abrikos', 'Granatæble',
        'Honningmelon', 'Cantaloupemelon', 'Galiamelon', 'Vandmelon', 'Papaya',
        'Passionsfrugt', 'Figen', 'Kaki', 'Kokosnød', 'Dragefrugt',
        -- Grøntsager
        'Kartofler', 'Bagekartofler', 'Søde kartofler', 'Gulerødder', 'Gule løg', 'Rødløg',
        'Skalotteløg', 'Hvidløg', 'Porre', 'Forårsløg', 'Agurk', 'Tomat', 'Bøftomat',
        'Rød peberfrugt', 'Gul peberfrugt', 'Grøn peberfrugt', 'Spidspeber', 'Chili',
        'Squash', 'Aubergine', 'Broccoli', 'Blomkål', 'Hvidkål', 'Rødkål', 'Spidskål',
        'Savojkål', 'Rosenkål', 'Grønkål', 'Kinakål', 'Pak choi', 'Fennikel',
        'Knoldselleri', 'Bladselleri', 'Pastinak', 'Persillerod', 'Rødbeder', 'Majroer',
        'Kålrabi', 'Jordskokker', 'Peberrod', 'Ingefær', 'Champignon', 'Portobellosvampe',
        'Hokkaidogræskar', 'Butternutgræskar', 'Majskolbe', 'Icebergsalat', 'Hjertesalat',
        'Radiser', 'Grønne asparges', 'Hvide asparges', 'Artiskok', 'Grønne bønner',
        'Sukkerærter', 'Rabarber'
    ]) WITH ORDINALITY
),
missing AS (
    SELECT name, ord FROM produce
    WHERE NOT EXISTS (SELECT 1 FROM products p WHERE lower(p.product_name) = lower(produce.name))
    ORDER BY ord
),
numbered AS (
    SELECT nextval(pg_get_serial_sequence('products', 'id')) AS id, name FROM missing
),
inserted AS (
    INSERT INTO products (id, product_barcode, product_name, stock)
    SELECT id, id::text, name, 1 FROM numbered
    ON CONFLICT (product_barcode) DO NOTHING
    RETURNING id
)
INSERT INTO product_categories (product_id, category_id)
SELECT inserted.id, c.id
FROM inserted
JOIN categories c ON c.name = 'Frugt og Grønt'
ON CONFLICT DO NOTHING;
