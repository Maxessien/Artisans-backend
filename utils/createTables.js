import pool from "./../configs/sqlConnection.js";

const importUuidDExtensionQuery = async () =>
  await pool.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");

const createUserTable = async () => {
  await importUuidDExtensionQuery();
  await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            userId UUID PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            displayName TEXT NOT NULL,
            pictureUrl TEXT NOT NULL DEFAULT 'default_url',
            picturePublicId TEXT,
            phoneNumber TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user','admin')),
            address TEXT,
            preferredPaymentMethod TEXT NOT NULL DEFAULT 'Not Set' CHECK(prefferedPaymentMethod IN ('Nort Set', 'Paystack', 'On Delivery'))
            dateAdded TIMESTAMPZ NOT NULL DEFAULT NOW()
        );
    `);
};

const createCartsTable = async () => {
  await importUuidDExtensionQuery();
  await pool.query(`
        CREATE TABLE IF NOT EXISTS carts (
            productId UUID PRIMARY KEY REFERENCES products(productId),
            userId UUID NOT NULL REFERENCES users(userId) ON DELETE CASCADE,
            variant TEXT,
            quantity INTEGER NOT NULL DEFAULT 1,
            dateAdded TIMESTAMPZ NOT NULL DEFAULT NOW()
        )
    `);
};

const createProductsTable = async () => {
  await importUuidDExtensionQuery();
  await pool.query("CREATE EXTENSION IF NOT EXISTS vector")
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
        productId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        productName TEXT NOT NULL,
        price INTEGER NOT NULL,
        category TEXT REFERENCES categories(title) ON DELETE SET NULL,
        vendorId UUID NOT NULL REFERENCES users(userId),
        description TEXT NOT NULL,
        vectorRep VECTOR(10) DEFAULT '{}'::text[],
        dateAdded TIMESTAMPZ NOT NULL DEFAULT NOW()
    )
`);
};

const createProductImagesTable = async () => {
  await pool.query(`
        CREATE TABLE IF NOT EXISTS productImages (
            imagePublicId TEXT PRIMARY KEY,
            productId UUID NOT NULL REFERENCES products(productId) ON DELETE CASCADE,
            imageUrl TEXT NOT NULL,
            dateAdded TIMESTAMPZ NOT NULL DEFAULT NOW()
        )
    `);
};

const createOrdersTable = async () => {
  await importUuidDExtensionQuery();
  await pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
            orderId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            productId UUID NOT NULL REFERENCES products(productId),
            vendorId UUID NOT NULL REFERENCES users(userId),
            quantityOrdered INTEGER NOT NULL DEFAULT 1,
            deliveryStatus TEXT NOT NULL CHECK(deliveryStatus IN ('pending', 'delivered', 'delivering', 'cancelled')),
            userId  UUID NOT NULL REFERENCES users(userId),
            address TEXT NOT NULL,
            dateAdded TIMESTAMPZ NOT NULL DEFAULT NOW()
        )
    `);
};

const createAuthOtpTable = async () => {
  await importUuidDExtensionQuery();
  await pool.query(`
        CREATE TABLE IF NOT EXISTS authOtps (
            otpId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            otpType TEXT NOT NULL DEFAULT 'email' CHECK(otpType IN ('email', 'phoneNumber')),
            value CHAR(6) NOT NULL,
            receiver TEXT NOT NULL,
            expiryTime TIMESTAMPZ NOT NULL DEFAULT NOW() + INTERVAL '5 minutes',
            dateAdded TIMESTAMPZ NOT NULL DEFAULT NOW()
        )
    `);
};

const createReviewsTable = async () => {
  await importUuidDExtensionQuery();
  await pool.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                reviewsId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                userId UUID NOT NULL REFERENCES users(userId),
                productId UUID NOT NULL REFERENCES products(productId),
                ratings INTEGER NOT NULL,
                comment TEXT NOT NULL,
                dateAdded TIMESTAMPZ NOT NULL DEFAULT NOW()
            )
        `);
};

const createCategoriesTable = async () => {
  await pool.query(`
            CREATE TABLE IF NOT EXISTS categories (
                title TEXT PRIMARY KEY,
                imageUrl TEXT NOT NULL,
                dateAdded TIMESTAMPZ NOT NULL DEFAULT NOW()
            )
        `);
};

export {
  createUserTable,
  createCartsTable,
  createProductsTable,
  createProductImagesTable,
  createOrdersTable,
  createAuthOtpTable,
  createReviewsTable,
  createCategoriesTable,
};
