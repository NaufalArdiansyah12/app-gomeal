-- =============================================
-- GoMeal v3 - Advanced Database Setup
-- Database: db_tokokita
-- =============================================

USE db_tokokita;

-- 1. Create tbl_log if not exists
CREATE TABLE IF NOT EXISTS tbl_log (
    id_log INT(11) PRIMARY KEY AUTO_INCREMENT,
    aktivitas VARCHAR(100),
    waktu TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 1b. Create tbl_users for authentication with role
CREATE TABLE IF NOT EXISTS tbl_users (
    id_user INT(11) PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'pelanggan') NOT NULL DEFAULT 'pelanggan',
    id_pelanggan INT(11) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_pelanggan FOREIGN KEY (id_pelanggan) REFERENCES tbl_pelanggan(id_pelanggan) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Populate 6 Categories if not present
INSERT IGNORE INTO tbl_kategori (id_kategori, nama_kategori) VALUES
(1, 'Bakery'),
(2, 'Burger'),
(3, 'Beverage'),
(4, 'Chicken'),
(5, 'Pizza'),
(6, 'Seafood')
ON DUPLICATE KEY UPDATE nama_kategori = VALUES(nama_kategori);

-- 3. Populate Products matching GoMeal v3 UI & Categories
-- id_kategori: 1=Bakery, 2=Burger, 3=Beverage, 4=Chicken, 5=Pizza, 6=Seafood
INSERT INTO tbl_produk (nama_produk, id_kategori, harga, stok)
SELECT 'Fish Burger', 2, 35000.00, 45 WHERE NOT EXISTS (SELECT 1 FROM tbl_produk WHERE nama_produk = 'Fish Burger');
INSERT INTO tbl_produk (nama_produk, id_kategori, harga, stok)
SELECT 'Beef Burger', 2, 45000.00, 50 WHERE NOT EXISTS (SELECT 1 FROM tbl_produk WHERE nama_produk = 'Beef Burger');
INSERT INTO tbl_produk (nama_produk, id_kategori, harga, stok)
SELECT 'Cheese Burger', 2, 40000.00, 40 WHERE NOT EXISTS (SELECT 1 FROM tbl_produk WHERE nama_produk = 'Cheese Burger');
INSERT INTO tbl_produk (nama_produk, id_kategori, harga, stok)
SELECT 'Margherita Pizza', 5, 65000.00, 30 WHERE NOT EXISTS (SELECT 1 FROM tbl_produk WHERE nama_produk = 'Margherita Pizza');
INSERT INTO tbl_produk (nama_produk, id_kategori, harga, stok)
SELECT 'Spicy Ramen', 4, 42000.00, 35 WHERE NOT EXISTS (SELECT 1 FROM tbl_produk WHERE nama_produk = 'Spicy Ramen');
INSERT INTO tbl_produk (nama_produk, id_kategori, harga, stok)
SELECT 'Garden Bowl', 1, 32000.00, 25 WHERE NOT EXISTS (SELECT 1 FROM tbl_produk WHERE nama_produk = 'Garden Bowl');
INSERT INTO tbl_produk (nama_produk, id_kategori, harga, stok)
SELECT 'Pepperoni Pizza', 5, 75000.00, 20 WHERE NOT EXISTS (SELECT 1 FROM tbl_produk WHERE nama_produk = 'Pepperoni Pizza');
INSERT INTO tbl_produk (nama_produk, id_kategori, harga, stok)
SELECT 'Crispy Chicken', 4, 38000.00, 40 WHERE NOT EXISTS (SELECT 1 FROM tbl_produk WHERE nama_produk = 'Crispy Chicken');
INSERT INTO tbl_produk (nama_produk, id_kategori, harga, stok)
SELECT 'Croissant Butter', 1, 22000.00, 50 WHERE NOT EXISTS (SELECT 1 FROM tbl_produk WHERE nama_produk = 'Croissant Butter');
INSERT INTO tbl_produk (nama_produk, id_kategori, harga, stok)
SELECT 'Iced Lemon Tea', 3, 15000.00, 60 WHERE NOT EXISTS (SELECT 1 FROM tbl_produk WHERE nama_produk = 'Iced Lemon Tea');
INSERT INTO tbl_produk (nama_produk, id_kategori, harga, stok)
SELECT 'Grilled Salmon', 6, 85000.00, 15 WHERE NOT EXISTS (SELECT 1 FROM tbl_produk WHERE nama_produk = 'Grilled Salmon');
INSERT INTO tbl_produk (nama_produk, id_kategori, harga, stok)
SELECT 'Shrimp Basket', 6, 55000.00, 25 WHERE NOT EXISTS (SELECT 1 FROM tbl_produk WHERE nama_produk = 'Shrimp Basket');

-- 4. Customer: Patricia A. (Elm Street, New York / Surabaya)
INSERT INTO tbl_pelanggan (id_pelanggan, nama_pelanggan, kota)
SELECT 100, 'Patricia A.', 'Surabaya'
WHERE NOT EXISTS (SELECT 1 FROM tbl_pelanggan WHERE id_pelanggan = 100 OR nama_pelanggan = 'Patricia A.');

-- 5. Seed initial past transactions for Patricia A. so Recent Order and Tier are populated
-- Transaction 1: Margherita Pizza
INSERT INTO tbl_transaksi (id_transaksi, tanggal, id_pelanggan, total_belanja)
SELECT 101, '2026-11-10', 100, 25.80 WHERE NOT EXISTS (SELECT 1 FROM tbl_transaksi WHERE id_transaksi = 101);
INSERT INTO tbl_detail_transaksi (id_detail, id_transaksi, nama_produk, jumlah, harga)
SELECT 101, 101, 'Margherita Pizza', 1, 12.90 WHERE NOT EXISTS (SELECT 1 FROM tbl_detail_transaksi WHERE id_detail = 101);
INSERT INTO tbl_detail_transaksi (id_detail, id_transaksi, nama_produk, jumlah, harga)
SELECT 102, 101, 'Margherita Pizza', 1, 12.90 WHERE NOT EXISTS (SELECT 1 FROM tbl_detail_transaksi WHERE id_detail = 102);

-- Transaction 2: Spicy Ramen
INSERT INTO tbl_transaksi (id_transaksi, tanggal, id_pelanggan, total_belanja)
SELECT 102, '2026-11-12', 100, 9.40 WHERE NOT EXISTS (SELECT 1 FROM tbl_transaksi WHERE id_transaksi = 102);
INSERT INTO tbl_detail_transaksi (id_detail, id_transaksi, nama_produk, jumlah, harga)
SELECT 103, 102, 'Spicy Ramen', 1, 9.40 WHERE NOT EXISTS (SELECT 1 FROM tbl_detail_transaksi WHERE id_detail = 103);

-- Transaction 3: Garden Bowl (4 items total to reflect REORDERED 4X)
INSERT INTO tbl_transaksi (id_transaksi, tanggal, id_pelanggan, total_belanja)
SELECT 103, '2026-11-14', 100, 32.80 WHERE NOT EXISTS (SELECT 1 FROM tbl_transaksi WHERE id_transaksi = 103);
INSERT INTO tbl_detail_transaksi (id_detail, id_transaksi, nama_produk, jumlah, harga)
SELECT 104, 103, 'Garden Bowl', 2, 8.20 WHERE NOT EXISTS (SELECT 1 FROM tbl_detail_transaksi WHERE id_detail = 104);
INSERT INTO tbl_detail_transaksi (id_detail, id_transaksi, nama_produk, jumlah, harga)
SELECT 105, 103, 'Garden Bowl', 2, 8.20 WHERE NOT EXISTS (SELECT 1 FROM tbl_detail_transaksi WHERE id_detail = 105);

-- Additional transaction for Patricia to reach Gold Tier (> 100 total belanja)
INSERT INTO tbl_transaksi (id_transaksi, tanggal, id_pelanggan, total_belanja)
SELECT 104, '2026-11-15', 100, 42.00 WHERE NOT EXISTS (SELECT 1 FROM tbl_transaksi WHERE id_transaksi = 104);
INSERT INTO tbl_detail_transaksi (id_detail, id_transaksi, nama_produk, jumlah, harga)
SELECT 106, 104, 'Beef Burger', 4, 5.59 WHERE NOT EXISTS (SELECT 1 FROM tbl_detail_transaksi WHERE id_detail = 106);

-- 6. Indexes (PRD requirement 4.7)
DROP INDEX IF EXISTS idx_produk_nama ON tbl_produk;
CREATE INDEX idx_produk_nama ON tbl_produk(nama_produk);

DROP INDEX IF EXISTS idx_detail_nama_produk ON tbl_detail_transaksi;
CREATE INDEX idx_detail_nama_produk ON tbl_detail_transaksi(nama_produk);

DROP INDEX IF EXISTS idx_transaksi_tanggal ON tbl_transaksi;
CREATE INDEX idx_transaksi_tanggal ON tbl_transaksi(tanggal);

-- 7. Views (PRD requirement 4.1)
CREATE OR REPLACE VIEW view_katalog_produk AS
SELECT 
    p.id_produk,
    p.id_kategori,
    k.nama_kategori,
    p.nama_produk,
    p.harga,
    p.stok
FROM tbl_produk p
JOIN tbl_kategori k ON p.id_kategori = k.id_kategori;

CREATE OR REPLACE VIEW view_transaksi_pelanggan AS
SELECT 
    t.id_transaksi,
    t.tanggal,
    p.id_pelanggan,
    p.nama_pelanggan,
    p.kota,
    t.total_belanja
FROM tbl_transaksi t
JOIN tbl_pelanggan p ON t.id_pelanggan = p.id_pelanggan;

CREATE OR REPLACE VIEW view_total_belanja AS
SELECT 
    p.id_pelanggan,
    p.nama_pelanggan,
    COUNT(t.id_transaksi) AS total_transaksi,
    COALESCE(SUM(t.total_belanja), 0) AS total_belanja
FROM tbl_pelanggan p
LEFT JOIN tbl_transaksi t ON p.id_pelanggan = t.id_pelanggan
GROUP BY p.id_pelanggan, p.nama_pelanggan;

CREATE OR REPLACE VIEW view_recent_order AS
SELECT 
    t.id_pelanggan,
    dt.nama_produk,
    COUNT(dt.id_detail) AS reorder_count,
    MAX(t.tanggal) AS last_order_date,
    MAX(dt.harga) AS harga
FROM tbl_detail_transaksi dt
JOIN tbl_transaksi t ON dt.id_transaksi = t.id_transaksi
GROUP BY t.id_pelanggan, dt.nama_produk;

-- 8. Stored Functions (PRD requirement 4.4)
DROP FUNCTION IF EXISTS HitungDiskon;
DELIMITER $$
CREATE FUNCTION HitungDiskon(harga DECIMAL(12,2), diskon DECIMAL(5,2))
RETURNS DECIMAL(12,2)
DETERMINISTIC
BEGIN
    RETURN harga * (diskon / 100);
END$$
DELIMITER ;

DROP FUNCTION IF EXISTS HitungTotal;
DELIMITER $$
CREATE FUNCTION HitungTotal(harga DECIMAL(12,2), jumlah INT)
RETURNS DECIMAL(12,2)
DETERMINISTIC
BEGIN
    RETURN harga * jumlah;
END$$
DELIMITER ;

DROP FUNCTION IF EXISTS HitungPajak;
DELIMITER $$
CREATE FUNCTION HitungPajak(harga DECIMAL(12,2))
RETURNS DECIMAL(12,2)
DETERMINISTIC
BEGIN
    RETURN ROUND(harga * 0.10, 2);
END$$
DELIMITER ;

DROP FUNCTION IF EXISTS KategoriBelanja;
DELIMITER $$
CREATE FUNCTION KategoriBelanja(total DECIMAL(12,2))
RETURNS VARCHAR(50)
DETERMINISTIC
BEGIN
    IF total >= 100.00 THEN
        RETURN 'Gold member';
    ELSEIF total >= 50.00 THEN
        RETURN 'Pelanggan Silver';
    ELSE
        RETURN 'Pelanggan Reguler';
    END IF;
END$$
DELIMITER ;

DROP FUNCTION IF EXISTS HitungProgresTier;
DELIMITER $$
CREATE FUNCTION HitungProgresTier(total DECIMAL(12,2))
RETURNS INT
DETERMINISTIC
BEGIN
    -- Percentage progression: e.g. 60% progress to next tier
    IF total >= 150.00 THEN
        RETURN 100;
    ELSEIF total >= 100.00 THEN
        RETURN 60;
    ELSEIF total >= 50.00 THEN
        RETURN 40;
    ELSE
        RETURN 20;
    END IF;
END$$
DELIMITER ;

-- 9. Stored Procedures (PRD requirement 4.3)
DROP PROCEDURE IF EXISTS TambahPelanggan;
DELIMITER $$
CREATE PROCEDURE TambahPelanggan(IN p_nama VARCHAR(100), IN p_kota VARCHAR(50))
BEGIN
    INSERT INTO tbl_pelanggan (nama_pelanggan, kota) VALUES (p_nama, p_kota);
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS LaporanTransaksi;
DELIMITER $$
CREATE PROCEDURE LaporanTransaksi(IN p_id INT)
BEGIN
    SELECT 
        p.id_pelanggan,
        p.nama_pelanggan, 
        t.id_transaksi, 
        t.tanggal, 
        t.total_belanja
    FROM tbl_pelanggan p
    JOIN tbl_transaksi t ON p.id_pelanggan = t.id_pelanggan
    WHERE p.id_pelanggan = p_id
    ORDER BY t.tanggal DESC, t.id_transaksi DESC;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS CekTransaksi;
DELIMITER $$
CREATE PROCEDURE CekTransaksi(IN p_id INT)
BEGIN
    SELECT 
        t.id_transaksi,
        t.tanggal,
        t.total_belanja,
        dt.nama_produk,
        dt.jumlah,
        dt.harga,
        (dt.jumlah * dt.harga) AS subtotal
    FROM tbl_transaksi t
    JOIN tbl_detail_transaksi dt ON t.id_transaksi = dt.id_transaksi
    WHERE t.id_pelanggan = p_id
    ORDER BY t.tanggal DESC, t.id_transaksi DESC;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS ProsesTambahTransaksi;
DELIMITER $$
CREATE PROCEDURE ProsesTambahTransaksi(
    IN p_tanggal DATE,
    IN p_id_pelanggan INT,
    IN p_nama_produk VARCHAR(100),
    IN p_jumlah INT,
    IN p_diskon_persen DECIMAL(5,2),
    OUT p_id_transaksi INT
)
BEGIN
    DECLARE v_harga DECIMAL(12,2);
    DECLARE v_subtotal DECIMAL(12,2);
    DECLARE v_potongan DECIMAL(12,2);
    DECLARE v_total DECIMAL(12,2);

    -- Get product price
    SELECT harga INTO v_harga FROM tbl_produk WHERE nama_produk = p_nama_produk LIMIT 1;
    
    IF v_harga IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Produk tidak ditemukan';
    END IF;

    -- Calculate total using Stored Functions
    SET v_subtotal = HitungTotal(v_harga, p_jumlah);
    SET v_potongan = HitungDiskon(v_subtotal, p_diskon_persen);
    SET v_total = v_subtotal - v_potongan;

    -- Insert header
    INSERT INTO tbl_transaksi (tanggal, id_pelanggan, total_belanja)
    VALUES (p_tanggal, p_id_pelanggan, v_total);

    SET p_id_transaksi = LAST_INSERT_ID();

    -- Insert detail
    INSERT INTO tbl_detail_transaksi (id_transaksi, nama_produk, jumlah, harga)
    VALUES (p_id_transaksi, p_nama_produk, p_jumlah, v_harga);
END$$
DELIMITER ;

-- 10. Triggers (PRD requirement 4.5)
DROP TRIGGER IF EXISTS before_insert_transaksi;
DELIMITER $$
CREATE TRIGGER before_insert_transaksi
BEFORE INSERT ON tbl_transaksi
FOR EACH ROW
BEGIN
    IF NEW.total_belanja < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Total belanja tidak boleh bernilai negatif';
    END IF;
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS after_insert_detail;
DELIMITER $$
CREATE TRIGGER after_insert_detail
AFTER INSERT ON tbl_detail_transaksi
FOR EACH ROW
BEGIN
    -- Kurangi stok tbl_produk
    UPDATE tbl_produk 
    SET stok = stok - NEW.jumlah 
    WHERE nama_produk = NEW.nama_produk;

    -- Catat ke tbl_log
    INSERT INTO tbl_log (aktivitas, waktu)
    VALUES (CONCAT('Pengurangan stok produk: ', NEW.nama_produk, ' sebanyak ', NEW.jumlah), NOW());
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS after_insert_pelanggan;
DELIMITER $$
CREATE TRIGGER after_insert_pelanggan
AFTER INSERT ON tbl_pelanggan
FOR EACH ROW
BEGIN
    INSERT INTO tbl_log (aktivitas, waktu)
    VALUES (CONCAT('Pelanggan baru ditambahkan: ', NEW.nama_pelanggan), NOW());
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS after_update_pelanggan;
DELIMITER $$
CREATE TRIGGER after_update_pelanggan
AFTER UPDATE ON tbl_pelanggan
FOR EACH ROW
BEGIN
    INSERT INTO tbl_log (aktivitas, waktu)
    VALUES (CONCAT('Data pelanggan diperbarui: ', NEW.nama_pelanggan), NOW());
END$$
DELIMITER ;
