import pool from "../configs/sqlConnection.js";
import logger from "../utils/logger.js";
import { genParamsFromArray } from "../utils/usersUtilFns.js";

const placeOrders = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const bodyFlattened = req.body.map((obj = {}) => {
      const tempArr = [];
      for (const value in obj) tempArr.push(obj[value]);
      tempArr.push(req.auth.uid)
      return tempArr;
    });
    let paramStr = "";
    bodyFlattened.forEach(
      (obj, index) =>
        (paramStr +=
          index + 1 === bodyFlattened.length
            ? genParamsFromArray(index * obj.length + 1, obj)
            : `${genParamsFromArray(index * obj.length + 1, obj)},`)
    );
    const productIdParam = genParamsFromArray(
      2,
      req.body.map((obj) => obj.productId)
    );
    const addOrderQuery = `INSERT INTO orders (product_id, quantity_ordered, address, payment_method, user_id) 
                            VALUES ${paramStr}`;
    const deleteFromCartQuery = `DELETE FROM carts WHERE user_id = $1 AND product_id IN ${productIdParam}`;
    await client.query(addOrderQuery, bodyFlattened.flat());
    await client.query(deleteFromCartQuery, [
      req.auth.uid,
      ...req.body.map((obj) => obj.productId),
    ]);
    await client.query("COMMIT");
    return res.status(201).json({ message: "Order Created" });
  } catch (err) {
    logger.error("placeOrders error", err);
    await client.query("ROLLBACK");
    return res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

const getOrderHistory = async (req, res) => {
  try {
    const {
      orderBy = "date_added",
      direction = "desc",
      status = "active",
      limit = 20,
    } = req.query;
    const allowedColumns = ["date_added", "price"];
    const safeOrderBy = allowedColumns.includes(orderBy)
      ? orderBy
      : "date_added";
    const orderQuery = `SELECT o.order_id, o.product_id, o.quantity_ordered, o.date_added, p.product_name, p.price, i.image_url
                        FROM orders AS o
                        JOIN products AS p ON o.product_id = p.product_id
                        JOIN product_images AS i ON i.product_id = p.product_id
                        WHERE o.user_id = $1 AND o.delivery_status = $2
                        ORDER BY ${safeOrderBy} ${
      direction === "desc" ? "DESC" : "ASC"
    }
                        LIMIT $3`;
    const orders = await pool.query(orderQuery, [
      req.auth.uid,
      status,
      limit,
    ]);
    logger.log("getOrderHistory result", orders);
    return res.status(200).json(orders.rows);
  } catch (err) {
    logger.error("getOrderHistory error", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const getSingleOrder = async (req, res) => {
  try {
    const query = `SELECT o.order_id, o.product_id, o.payment_method, o.address, o.quantity_ordered, o.date_added,
                    u.display_name, u.email, u.phone_number
                    FROM orders AS o
                    JOIN users AS u ON o.user_id = u.user_id
                    WHERE o.order_id = $1`;
    const order = await pool.query(query, [req.query.orderId]);
    return res.status(200).json(order?.rows[0] ?? []);
  } catch (err) {
    logger.error("Error getting single order", err);
    return res.status(500).json(err);
  }
};

const cancelOrder = async (req, res) => {
  try {
    const query = `UPDATE orders SET delivery_status = $1 WHERE order_id = $2`;
    await pool.query(query, ["cancelled", req.params.orderId]);
    return res.status(200).json({ message: "Order cancelled successfully" });
  } catch (err) {
    logger.error("cancelOrder error", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const getVendorOrders = async (req, res) => {
  try {
    const {
      orderBy = "date_added",
      direction = "desc",
      status = ["pending", "delivered", "cancelled", "delivering"],
      limit = 20,
    } = req.query;
    const orderQuery = `SELECT * FROM orders WHERE product_id IN (SELECT product_id FROM products WHERE vendor_id = $1)
                          AND delivery_status IN ${
                            status?.length > 0 && Array.isArray(status)
                              ? genParamsFromArray(4, status)
                              : genParamsFromArray(4, [
                                  "pending",
                                  "delivered",
                                  "cancelled",
                                  "delivering",
                                ])
                          }
                          ORDER BY $2 ${direction === "desc" ? "DESC" : "ASC"}
                          LIMIT $3`;
    const orders = await pool.query(orderQuery, [
      req.auth.uid,
      orderBy,
      limit,
      ...(status?.length > 0 && Array.isArray(status)
        ? status
        : ["pending", "delivered", "cancelled", "delivering"]),
    ]);
    return res.status(200).json(orders.rows);
  } catch (err) {
    logger.error("getVendorOrders error", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const query = `UPDATE orders SET delivery_status = $1 WHERE order_id = $2
                    AND (user_id = $3 OR product_id IN (SELECT product_id FROM products WHERE vendor_id = $3))`;
    await pool.query(query, [req.body.status, req.body.orderId, req.auth.uid]);
    return res.status(200).json({ message: "Order updated successfully" });
  } catch (err) {
    logger.error("updateOrderStatus error", err);
    return res.status(500).json(err);
  }
};

export {
  cancelOrder,
  getOrderHistory,
  getVendorOrders,
  placeOrders,
  updateOrderStatus,
  getSingleOrder,
};
