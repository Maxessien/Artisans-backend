import pool from "../configs/sqlConnection.js";
import { genParamsFromArray } from "../utils/usersUtilFns.js";
import logger from "../utils/logger.js";

const placeOrders = async (req, res) => {
  const client = pool.connect();
  try {
    const bodyFlattened = req.body.map((obj = {}) => {
      const tempArr = [];
      for (const value in obj) tempArr.push(obj[value]);
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
    const addOrderQuery = `INSERT INTO orders (productId, userId, quantityOrdered, address) 
                            VALUES ${paramStr}`;
    const deleteFromCartQuery = `DELETE FROM carts WHERE userId = $1 AND productId IN ${productIdParam}`;
    await client.query(addOrderQuery, bodyFlattened.flat());
    await client.query(deleteFromCartQuery, [
      req.body[0].userId,
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
      orderBy = "dateAdded",
      direction = "desc",
      status = ["pending", "delivered", "cancelled", "delivering"],
      limit = 20,
    } = req.query;
    const orderQuery = `SELECT * FROM orders WHERE userId = $1 AND deliveryStatus IN ${
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
    logger.log("getOrderHistory result", orders);
    return res.status(200).json(orders.rows);
  } catch (err) {
    logger.error("getOrderHistory error", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const query = `UPDATE orders SET deliveryStatus = $1 WHERE orderId = $2`
    await pool.query(query, ["cancelled", req.params.orderId])
    return res.status(200).json({ message: "Order cancelled successfully" });
  } catch (err) {
    logger.error("cancelOrder error", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const getVendorOrders = async (req, res) => {
  try {
    const {
      orderBy = "dateAdded",
      direction = "desc",
      status = ["pending", "delivered", "cancelled", "delivering"],
      limit = 20,
    } = req.query;
    const orderQuery = `SELECT * FROM orders WHERE productId IN (SELECT productId FROM products WHERE vendorId = $1)
                          AND deliveryStatus IN ${
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
    const query = `UPDATE orders SET deliveryStatus = $1 WHERE orderId = $2
                    AND (userId = $3 OR productId IN (SELECT productId FROM products WHERE vendorId = $3))`
    await pool.query(query, [req.body.status, req.body.orderId, req.auth.uid])
    return res.status(200).json({message: "Order updated successfully"});
  } catch (err) {
    logger.error("updateOrderStatus error", err);
    return res.status(500).json(err);
  }
};

export {
  placeOrders,
  cancelOrder,
  getOrderHistory,
  getVendorOrders,
  updateOrderStatus,
};
