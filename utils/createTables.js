import pool from "./../configs/sqlConnection.js";

const importUuidDExtensionQuery = async () =>
  await pool.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");

const createUserTable = async () => {
  await importUuidDExtensionQuery();
  await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            user_id UUID PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            display_name TEXT NOT NULL,
            picture_url TEXT NOT NULL DEFAULT 'default_url',
            picture_public_id TEXT,
            phone_number TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user','admin')),
            address TEXT,
            preferred_payment_method TEXT NOT NULL DEFAULT 'Not Set' CHECK(preferred_payment_method IN ('Nort Set', 'Paystack', 'On Delivery')),
            date_added TIMESTAMPZ NOT NULL DEFAULT NOW()
        );
    `);
};

const createCartsTable = async () => {
  await importUuidDExtensionQuery();
  await pool.query(`
        CREATE TABLE IF NOT EXISTS carts (
            cart_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            product_id UUID NOT NULL REFERENCES products(product_id),
            user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
            variant TEXT,
            quantity INTEGER NOT NULL DEFAULT 1,
            date_added TIMESTAMPZ NOT NULL DEFAULT NOW()
        )
    `);
};

const createProductsTable = async () => {
  await importUuidDExtensionQuery();
  await pool.query("CREATE EXTENSION IF NOT EXISTS vector");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
        product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_name TEXT NOT NULL,
        price INTEGER NOT NULL,
        category TEXT REFERENCES categories(title) ON DELETE SET NULL,
        vendor_id UUID NOT NULL REFERENCES users(user_id),
        description TEXT NOT NULL,
        vector_rep VECTOR(10) DEFAULT '{}'::text[],
        date_added TIMESTAMPZ NOT NULL DEFAULT NOW()
    )
`);
};

const createProductImagesTable = async () => {
  await pool.query(`
        CREATE TABLE IF NOT EXISTS product_images (
            image_public_id TEXT PRIMARY KEY,
            product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
            image_url TEXT NOT NULL,
            date_added TIMESTAMPZ NOT NULL DEFAULT NOW()
        )
    `);
};

const createOrdersTable = async () => {
  await importUuidDExtensionQuery();
  await pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
            order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            product_id UUID NOT NULL REFERENCES products(product_id),
            quantity_ordered INTEGER NOT NULL DEFAULT 1,
            payment_method TEXT NOT NULL CHECK('paystack', 'flutterwave', 'on delivery')
            date_delivered TIMESTAMPZ,
            delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK(delivery_status IN ('pending', 'delivered', 'delivering', 'cancelled')),
            user_id  UUID NOT NULL REFERENCES users(user_id),
            address TEXT NOT NULL,
            date_added TIMESTAMPZ NOT NULL DEFAULT NOW()
        )
    `);
};

const createAuthOtpTable = async () => {
  await importUuidDExtensionQuery();
  await pool.query(`
        CREATE TABLE IF NOT EXISTS auth_otps (
            otp_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            otp_type TEXT NOT NULL DEFAULT 'email' CHECK(otp_type IN ('email', 'phoneNumber')),
            value CHAR(6) NOT NULL,
            receiver TEXT NOT NULL,
            expiry_time TIMESTAMPZ NOT NULL DEFAULT NOW() + INTERVAL '5 minutes',
            date_added TIMESTAMPZ NOT NULL DEFAULT NOW()
        )
    `);
};

const createReviewsTable = async () => {
  await importUuidDExtensionQuery();
  await pool.query(`
        CREATE TABLE IF NOT EXISTS reviews (
            reviews_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(user_id),
            product_id UUID NOT NULL REFERENCES products(product_id),
            ratings INTEGER NOT NULL,
            comment TEXT NOT NULL,
            date_added TIMESTAMPZ NOT NULL DEFAULT NOW()
        )
    `);
};

const createCategoriesTable = async () => {
  await pool.query(`
        CREATE TABLE IF NOT EXISTS categories (
            title TEXT PRIMARY KEY,
            image_url TEXT NOT NULL,
            date_added TIMESTAMPZ NOT NULL DEFAULT NOW()
        )
    `);
};

const createNotificationsTable = async () => {
  await pool.query(`
        CREATE TABLE IF NOT EXISTS notifications (
            notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            icon_url TEXT NOT NULL DEFAULT 'default_utl',
            is_read BOOLEAN NOT NULL DEFAULT FALSE,
            message TEXT NOT NULL,
            time_notified TIMESTAMPZ NOT NULL DEFAULT NOW()
        )
    `);
};

export {
  createAuthOtpTable,
  createCartsTable,
  createCategoriesTable,
  createOrdersTable,
  createNotificationsTable,
  createProductImagesTable,
  createProductsTable,
  createReviewsTable,
  createUserTable,
};
