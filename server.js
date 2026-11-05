const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");

const app = express();
const PORT = Number(process.env.PORT || 5000);
const trustedFrontendOrigins = new Set(
    (process.env.FRONTEND_ORIGINS || process.env.FRONTEND_ORIGIN || "")
        .split(",").map(origin => origin.trim()).filter(Boolean)
);

function isAllowedOrigin(origin) {
    if (!origin || trustedFrontendOrigins.has(origin)) return true;
    try {
        const parsed = new URL(origin);
        return parsed.protocol === "http:" &&
            ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
    } catch (error) {
        return false;
    }
}

function databaseErrorMessage(error) {
    if (error.code === "ER_BAD_DB_ERROR") {
        return "The configured cafe database is missing. Check the existing MySQL Workbench connection and DB_NAME; do not rerun the master script on a database you want to keep.";
    }
    if (error.code === "ER_NO_SUCH_TABLE") {
        return "A required table is missing from the configured schema. The supplied schema does not include contact_messages, so website contact submissions cannot be stored.";
    }
    if (error.code === "ECONNREFUSED" || error.code === "PROTOCOL_CONNECTION_LOST") {
        return "Cannot connect to MySQL. Start MySQL Server and check the DB_HOST and DB_PORT settings.";
    }
    if (error.code === "ER_ACCESS_DENIED_ERROR") {
        return "MySQL rejected the configured credentials. Check DB_USER and DB_PASSWORD.";
    }
    return "The server could not complete the request. Check the server log for details.";
}

app.use(cors({
    origin(origin, callback) {
        callback(null, isAllowedOrigin(origin));
    },
    credentials: true
}));
app.use((req, res, next) => {
    if (req.path.startsWith("/api/") &&
        ["POST", "PUT", "PATCH", "DELETE"].includes(req.method) &&
        req.headers.origin && !isAllowedOrigin(req.headers.origin)) {
        return res.status(403).json({ error: "This request origin is not allowed." });
    }
    next();
});
app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    res.set("X-Content-Type-Options", "nosniff");
    next();
});
app.use(express.json({ limit: "20kb" }));
app.use((req, res, next) => {
    if (!req.path.startsWith("/api/") ||
        !["POST", "PUT", "PATCH"].includes(req.method)) return next();
    if (req.body === undefined) req.body = {};
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
        return res.status(400).json({ error: "Request body must be a JSON object." });
    }
    next();
});
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});
app.use(express.static(path.join(__dirname, "..", "frontend")));

app.get("/api/health", async (req, res, next) => {
    try {
        await db.query("SELECT 1");
        res.json({ status: "ok", database: "connected" });
    } catch (error) {
        console.error("Database health check failed:", error.code || error.message);
        res.status(503).json({
            status: "error",
            database: "disconnected",
            error: databaseErrorMessage(error)
        });
    }
});

app.get("/api/menu", async (req, res, next) => {
    try {
        const [items] = await db.execute(
            `SELECT item_id, item_name, category, price, availability
             FROM menu ORDER BY category, item_name`
        );
        res.json(items);
    } catch (error) {
        next(error);
    }
});

app.post("/api/menu", async (req, res, next) => {
    const name = typeof req.body.item_name === "string" ? req.body.item_name.trim() : "";
    const category = typeof req.body.category === "string" ? req.body.category.trim() : "";
    const price = Number(req.body.price);
    const availability = req.body.availability !== false;
    if (!name || name.length > 100 || !category || category.length > 50 ||
        !Number.isFinite(price) || price <= 0 || price > 100000) {
        return res.status(400).json({ error: "Provide a name (up to 100 characters), category (up to 50 characters), and a price greater than ₹0." });
    }
    try {
        const [result] = await db.execute(
            "INSERT INTO menu (item_name, category, price, availability) VALUES (?, ?, ?, ?)",
            [name, category, price, availability]
        );
        res.status(201).json({
            item_id: result.insertId,
            item_name: name,
            category,
            price,
            availability
        });
    } catch (error) {
        next(error);
    }
});

app.put("/api/menu/:id", async (req, res, next) => {
    const itemId = Number(req.params.id);
    const name = typeof req.body.item_name === "string" ? req.body.item_name.trim() : "";
    const category = typeof req.body.category === "string" ? req.body.category.trim() : "";
    const price = Number(req.body.price);
    const availability = req.body.availability !== false;
    if (!Number.isInteger(itemId) || itemId < 1 || !name || name.length > 100 ||
        !category || category.length > 50 || !Number.isFinite(price) || price <= 0 || price > 100000) {
        return res.status(400).json({ error: "Provide a valid item ID, name, category, and price." });
    }
    try {
        const [existing] = await db.execute(
            "SELECT item_id FROM menu WHERE item_id = ?",
            [itemId]
        );
        if (!existing.length) return res.status(404).json({ error: "Menu item not found." });
        await db.execute(
            "UPDATE menu SET item_name = ?, category = ?, price = ?, availability = ? WHERE item_id = ?",
            [name, category, price, availability, itemId]
        );
        res.json({ item_id: itemId, item_name: name, category, price, availability });
    } catch (error) {
        next(error);
    }
});

app.delete("/api/menu/:id", async (req, res, next) => {
    const itemId = Number(req.params.id);
    if (!Number.isInteger(itemId) || itemId < 1) {
        return res.status(400).json({ error: "Enter a valid menu item ID." });
    }
    try {
        const [existing] = await db.execute(
            "SELECT item_id FROM menu WHERE item_id = ?",
            [itemId]
        );
        if (!existing.length) return res.status(404).json({ error: "Menu item not found." });
        await db.execute(
            "UPDATE menu SET availability = FALSE WHERE item_id = ?",
            [itemId]
        );
        res.json({ item_id: itemId, availability: false });
    } catch (error) {
        next(error);
    }
});

app.get("/api/dashboard", async (req, res, next) => {
    try {
        const [[summaryRows], [topItems], [dailySales], [topCustomers]] = await Promise.all([
            db.execute(
                `SELECT
                    (SELECT COUNT(*) FROM customer) AS customers,
                    (SELECT COUNT(*) FROM menu WHERE availability = TRUE) AS menu_items,
                    (SELECT COUNT(*) FROM orders) AS orders,
                    COALESCE((SELECT SUM(total_amount) FROM orders o
                        WHERE EXISTS (SELECT 1 FROM payments p
                            WHERE p.order_id = o.order_id AND p.payment_status = 'Paid')), 0) AS revenue,
                    COALESCE((SELECT SUM(total_amount) FROM orders o
                        WHERE DATE(order_date) = CURDATE()
                          AND EXISTS (SELECT 1 FROM payments p
                              WHERE p.order_id = o.order_id AND p.payment_status = 'Paid')), 0) AS today_revenue,
                    (SELECT COUNT(*) FROM orders WHERE status = 'Pending') AS pending_orders`
            ),
            db.execute(
                `SELECT m.item_name, m.category,
                        COALESCE(SUM(oi.quantity), 0) AS total_quantity_sold,
                        COALESCE(SUM(oi.quantity * oi.price), 0) AS total_revenue_generated
                 FROM menu m
                 LEFT JOIN order_items oi ON oi.item_id = m.item_id
                 GROUP BY m.item_id, m.item_name, m.category
                 ORDER BY total_quantity_sold DESC, m.item_name LIMIT 5`
            ),
            db.execute(
                `SELECT DATE(order_date) AS sales_date,
                        COUNT(order_id) AS total_orders,
                        COALESCE(SUM(total_amount), 0) AS total_revenue,
                        ROUND(AVG(total_amount), 2) AS avg_order_value
                 FROM orders
                 GROUP BY DATE(order_date)
                 ORDER BY sales_date DESC LIMIT 7`
            ),
            db.execute(
                `SELECT c.customer_id, c.customer_name,
                        COUNT(o.order_id) AS orders_count,
                        COALESCE(SUM(o.total_amount), 0) AS total_spent
                 FROM customer c
                 LEFT JOIN orders o ON o.customer_id = c.customer_id
                 GROUP BY c.customer_id, c.customer_name
                 ORDER BY total_spent DESC, c.customer_name LIMIT 5`
            )
        ]);
        res.json({
            summary: summaryRows[0],
            top_items: topItems,
            daily_sales: dailySales.reverse(),
            top_customers: topCustomers
        });
    } catch (error) {
        next(error);
    }
});

app.get("/api/orders", async (req, res, next) => {
    const requestedLimit = Number(req.query.limit || 100);
    const limit = Number.isInteger(requestedLimit)
        ? Math.max(1, Math.min(requestedLimit, 200))
        : 100;
    const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";
    const status = typeof req.query.status === "string" ? req.query.status : "";
    const allowedStatuses = ["Pending", "Confirmed", "Completed", "Cancelled"];
    if (status && !allowedStatuses.includes(status)) {
        return res.status(400).json({ error: "Choose a valid order status." });
    }

    const filters = [];
    const values = [];
    if (search) {
        filters.push("(CAST(o.order_id AS CHAR) = ? OR c.customer_name LIKE ?)");
        values.push(search, `%${search}%`);
    }
    if (status) {
        filters.push("o.status = ?");
        values.push(status);
    }

    try {
        const [orders] = await db.execute(
            `SELECT o.order_id, c.customer_name, o.order_date, o.total_amount,
                    o.status AS order_status,
                    GROUP_CONCAT(DISTINCT CONCAT(m.item_name, ' × ', oi.quantity)
                        ORDER BY oi.order_item_id SEPARATOR ', ') AS items,
                    MAX(p.payment_status) AS payment_status,
                    MAX(p.payment_method) AS payment_method
             FROM orders o
             JOIN customer c ON c.customer_id = o.customer_id
             LEFT JOIN order_items oi ON oi.order_id = o.order_id
             LEFT JOIN menu m ON m.item_id = oi.item_id
             LEFT JOIN payments p ON p.order_id = o.order_id
             ${filters.length ? `WHERE ${filters.join(" AND ")}` : ""}
             GROUP BY o.order_id, c.customer_name, o.order_date, o.total_amount, o.status
             ORDER BY o.order_id ASC
             LIMIT ${limit}`,
            values
        );
        res.json(orders);
    } catch (error) {
        next(error);
    }
});

app.get("/api/customers", async (req, res, next) => {
    const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";
    try {
        const [customers] = await db.execute(
            `SELECT c.customer_id, c.customer_name, c.phone, c.email,
                    COUNT(o.order_id) AS orders_count,
                    COALESCE(SUM(o.total_amount), 0) AS total_spent
             FROM customer c
             LEFT JOIN orders o ON o.customer_id = c.customer_id
             ${search ? "WHERE c.customer_name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?" : ""}
             GROUP BY c.customer_id, c.customer_name, c.phone, c.email
             ORDER BY c.customer_id DESC LIMIT 200`,
            search ? [`%${search}%`, `%${search}%`, `%${search}%`] : []
        );
        res.json(customers);
    } catch (error) {
        next(error);
    }
});

app.get("/api/customers/:id", async (req, res, next) => {
    const customerId = Number(req.params.id);
    if (!Number.isInteger(customerId) || customerId < 1) {
        return res.status(400).json({ error: "Enter a valid customer ID." });
    }

    try {
        const [customers] = await db.execute(
            `SELECT customer_id, customer_name, phone, email
             FROM customer WHERE customer_id = ?`,
            [customerId]
        );
        if (!customers.length) {
            return res.status(404).json({ error: "Customer not found." });
        }
        res.json(customers[0]);
    } catch (error) {
        next(error);
    }
});

app.post("/api/customers", async (req, res, next) => {
    const name = typeof req.body.customer_name === "string"
        ? req.body.customer_name.trim()
        : "";
    const phone = typeof req.body.phone === "string" ? req.body.phone.trim() : "";
    const email = typeof req.body.email === "string" && req.body.email.trim()
        ? req.body.email.trim()
        : null;

    if (!name || name.length > 100) {
        return res.status(400).json({ error: "Name is required (up to 100 characters)." });
    }
    if (phone && !/^[0-9+\-()\s]{10,15}$/.test(phone)) {
        return res.status(400).json({ error: "Enter a valid phone number (10-15 characters)." });
    }
    if (email && (email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
        return res.status(400).json({ error: "Enter a valid email address." });
    }

    try {
        const [result] = await db.execute(
            "INSERT INTO customer (customer_name, phone, email) VALUES (?, ?, ?)",
            [name, phone || null, email]
        );
        res.status(201).json({
            customer_id: result.insertId,
            customer_name: name,
            phone: phone || null,
            email
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ error: "That email is already registered." });
        }
        next(error);
    }
});

app.delete("/api/customers/:id", async (req, res, next) => {
    const customerId = Number(req.params.id);
    if (!Number.isInteger(customerId) || customerId < 1) {
        return res.status(400).json({ error: "Enter a valid customer ID." });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();
        const [customers] = await connection.execute(
            "SELECT customer_id FROM customer WHERE customer_id = ? FOR UPDATE",
            [customerId]
        );
        if (!customers.length) {
            await connection.rollback();
            return res.status(404).json({ error: "Customer not found." });
        }

        const [orders] = await connection.execute(
            "SELECT order_id FROM orders WHERE customer_id = ? FOR UPDATE",
            [customerId]
        );
        const orderIds = orders.map(order => Number(order.order_id));
        if (orderIds.length) {
            await connection.execute(
                `DELETE p FROM payments p
                 INNER JOIN orders o ON o.order_id = p.order_id
                 WHERE o.customer_id = ?`,
                [customerId]
            );
            await connection.execute(
                `DELETE oi FROM order_items oi
                 INNER JOIN orders o ON o.order_id = oi.order_id
                 WHERE o.customer_id = ?`,
                [customerId]
            );
            await connection.execute("DELETE FROM orders WHERE customer_id = ?", [customerId]);
        }
        await connection.execute(
            "DELETE FROM customer WHERE customer_id = ?",
            [customerId]
        );
        await connection.commit();
        res.json({ customer_id: customerId, deleted_orders: orderIds.length });
    } catch (error) {
        if (connection) await connection.rollback();
        next(error);
    } finally {
        if (connection) connection.release();
    }
});

app.post("/api/contact", (req, res) => {
    res.status(501).json({
        error: "Contact messages cannot be saved because the supplied database schema has no contact_messages table."
    });
});

app.post("/api/orders", async (req, res, next) => {
    const customerId = Number(req.body.customer_id);
    const requestedItems = Array.isArray(req.body.items)
        ? req.body.items
        : [{ item_id: req.body.item_id, quantity: req.body.quantity }];
    if (!Number.isInteger(customerId) || customerId < 1 || !requestedItems.length ||
        requestedItems.length > 50 || requestedItems.some(item =>
            !item || !Number.isInteger(Number(item.item_id)) ||
            !Number.isInteger(Number(item.quantity)) ||
            Number(item.item_id) < 1 || Number(item.quantity) < 1 || Number(item.quantity) > 99
        )) {
        return res.status(400).json({ error: "Choose a customer and between 1 and 50 menu items, each with a quantity from 1 to 99." });
    }
    const itemQuantities = new Map();
    requestedItems.forEach(item => {
        const itemId = Number(item.item_id);
        itemQuantities.set(itemId, (itemQuantities.get(itemId) || 0) + Number(item.quantity));
    });
    if ([...itemQuantities.values()].some(quantity => quantity > 99)) {
        return res.status(400).json({ error: "The quantity for each menu item cannot exceed 99." });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [customers] = await connection.execute(
            "SELECT customer_id FROM customer WHERE customer_id = ? FOR UPDATE",
            [customerId]
        );
        if (!customers.length) {
            await connection.rollback();
            return res.status(404).json({ error: "Customer not found." });
        }
        const [employees] = await connection.execute(
            "SELECT employee_id FROM employees ORDER BY employee_id LIMIT 1 FOR UPDATE"
        );
        if (!employees.length) {
            await connection.rollback();
            return res.status(409).json({ error: "Add an employee before placing an order." });
        }
        const itemIds = [...itemQuantities.keys()];
        const [menuItems] = await connection.execute(
            `SELECT item_id, item_name, price FROM menu
             WHERE item_id IN (${itemIds.map(() => "?").join(", ")})
               AND availability = TRUE FOR UPDATE`,
            itemIds
        );
        if (menuItems.length !== itemIds.length) {
            await connection.rollback();
            return res.status(404).json({ error: "One or more selected menu items are unavailable." });
        }

        const pricedItems = menuItems.map(item => ({
            item_id: item.item_id,
            item_name: item.item_name,
            quantity: itemQuantities.get(Number(item.item_id)),
            price: Number(item.price),
            line_total: Number((Number(item.price) * itemQuantities.get(Number(item.item_id))).toFixed(2))
        }));
        const total = Number(pricedItems.reduce((sum, item) => sum + item.line_total, 0).toFixed(2));
        const [order] = await connection.execute(
            "INSERT INTO orders (customer_id, employee_id, total_amount, status) VALUES (?, ?, ?, 'Pending')",
            [customerId, employees[0].employee_id, total]
        );
        for (const item of pricedItems) {
            await connection.execute(
                "INSERT INTO order_items (order_id, item_id, quantity, price) VALUES (?, ?, ?, ?)",
                [order.insertId, item.item_id, item.quantity, item.price]
            );
        }
        await connection.commit();
        res.status(201).json({
            order_id: order.insertId,
            customer_id: customerId,
            items: pricedItems,
            total_amount: total,
            order_status: "Pending",
            payment_status: "Pending"
        });
    } catch (error) {
        if (connection) await connection.rollback();
        next(error);
    } finally {
        if (connection) connection.release();
    }
});

app.get("/api/orders/:id", async (req, res, next) => {
    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId) || orderId < 1) {
        return res.status(400).json({ error: "Enter a valid order ID." });
    }
    try {
        const [orders] = await db.execute(
            `SELECT o.order_id, o.customer_id, c.customer_name, o.order_date,
                    o.total_amount, o.status AS order_status,
                    p.payment_id, p.payment_method, p.payment_status
             FROM orders o
             JOIN customer c ON c.customer_id = o.customer_id
             LEFT JOIN payments p ON p.order_id = o.order_id
             WHERE o.order_id = ? ORDER BY p.payment_id DESC LIMIT 1`,
            [orderId]
        );
        if (!orders.length) {
            return res.status(404).json({ error: "Order not found." });
        }
        const [items] = await db.execute(
            `SELECT m.item_name, oi.quantity, oi.price,
                    (oi.quantity * oi.price) AS line_total
             FROM order_items oi
             LEFT JOIN menu m ON m.item_id = oi.item_id
             WHERE oi.order_id = ? ORDER BY oi.order_item_id`,
            [orderId]
        );
        res.json({ ...orders[0], items });
    } catch (error) {
        next(error);
    }
});

app.post("/api/payments", async (req, res, next) => {
    const orderId = Number(req.body.order_id);
    const amount = Number(req.body.amount);
    const method = req.body.payment_method;
    if (!Number.isInteger(orderId) || orderId < 1 ||
        !Number.isFinite(amount) || amount <= 0 ||
        !["Cash", "UPI", "Card", "Net Banking"].includes(method)) {
        return res.status(400).json({ error: "Provide a valid order, amount, and payment method." });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();
        const [orders] = await connection.execute(
            "SELECT order_id, total_amount, status FROM orders WHERE order_id = ? FOR UPDATE",
            [orderId]
        );
        if (!orders.length) {
            await connection.rollback();
            return res.status(404).json({ error: "Order not found." });
        }
        const order = orders[0];
        if (Number(order.total_amount) !== amount) {
            await connection.rollback();
            return res.status(400).json({ error: "Payment amount must match the order total." });
        }
        const [existing] = await connection.execute(
            "SELECT payment_id FROM payments WHERE order_id = ? AND payment_status = 'Paid' LIMIT 1",
            [orderId]
        );
        if (existing.length) {
            await connection.rollback();
            return res.status(409).json({ error: "This order has already been paid." });
        }
        const [payment] = await connection.execute(
            "INSERT INTO payments (order_id, amount, payment_method, payment_status) VALUES (?, ?, ?, 'Paid')",
            [orderId, amount, method]
        );
        await connection.execute(
            "UPDATE orders SET status = 'Confirmed' WHERE order_id = ?",
            [orderId]
        );
        await connection.commit();
        res.status(201).json({
            payment_id: payment.insertId,
            order_id: orderId,
            amount,
            payment_method: method,
            payment_status: "Paid",
            order_status: "Confirmed"
        });
    } catch (error) {
        if (connection) await connection.rollback();
        next(error);
    } finally {
        if (connection) connection.release();
    }
});

app.use((error, req, res, next) => {
    console.error("API error:", error.code || error.message);
    if (res.headersSent) return next(error);
    if (error.type === "entity.parse.failed") {
        return res.status(400).json({ error: "Request body must contain valid JSON." });
    }
    const status = ["ER_BAD_DB_ERROR", "ER_NO_SUCH_TABLE", "ECONNREFUSED",
        "PROTOCOL_CONNECTION_LOST", "ER_ACCESS_DENIED_ERROR"].includes(error.code)
        ? 503
        : 500;
    res.status(status).json({ error: databaseErrorMessage(error) });
});

app.listen(PORT, () => {
    console.log(`Friends Cafe is available at http://localhost:${PORT}`);
});
