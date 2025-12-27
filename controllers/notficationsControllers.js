import pool from "../configs/sqlConnection";
import logger from "../utils/logger";

const getUserNotifications = async (req, res) => {
  try {
    const query = `SELECT * FROM notfications WHERE user_id = $1`;
    const notifications = await pool.query(query, [req.auth.uid]);
    return res.status(200).json(notifications?.rows || []);
  } catch (err) {
    logger.error("Get user notifications error", err);
    return res.status(500).json(err);
  }
};

const markNotificationRead = async (req, res) => {
  try {
    await pool.query(
      "UPDATE notifications SET is_read = TRUE WHERE notification_id = $1 AND user_id = $2",
      [req.params.id, req.auth.uid]
    );
    return res.status(200).json({message: "Updated successfully"})
  } catch (err) {
    logger.error("Mark notifications error", err);
    return res.status(500).json(err);
  }
};

export { getUserNotifications, markNotificationRead };
