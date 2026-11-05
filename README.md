# Friends Cafe Management System

Friends Cafe is a full-stack café management project: responsive HTML/CSS/JavaScript frontend, Express/Node.js API, and MySQL storage.

## Screens

- `/` and `/index.html` — unified management dashboard with overview analytics, searchable order history, order creation, menu, customer directory, and payment recording.
- `/orders.html`, `/order.html`, `/customer.html`, `/menu.html`, and `/payment.html` remain available as dedicated pages for the same workflows.

The management overview and customer directory calculate their summaries directly from the `menu`, `order_items`, `orders`, and `customer` tables, so they work with the simpler Workbench schema without requiring additional views. Order placement and payment use MySQL transactions; invalid or failed writes are rejected or rolled back. The customer menu reads every row from `menu` and marks unavailable items without allowing them to be ordered.

The management dashboard and API do not require a login. Menu management, customer records, orders, payments, and analytics are available without role restrictions. Removing a menu item marks it unavailable instead of deleting it, preserving historical order links. Deleting a customer permanently removes their customer record and all linked orders, order items, and payment records in a single transaction; the UI asks for confirmation first. This no-login configuration is intended for a trusted local demonstration only; do not expose it to a public network because customer records are not access-controlled.

## Run locally (Windows PowerShell)

1. Start MySQL Server and open your saved connection in MySQL Workbench. Use the same host, port, username, password, and existing `friends_cafe` schema as that connection. Workbench is the client; the backend connects to the MySQL Server itself. The app uses the existing schema and does not create or modify database tables. Do not run `database/friends_cafe_adbms_master.sql` against a database you want to keep: it drops and recreates `friends_cafe`.
   If you need to set up or seed the app tables without deleting existing records, open and run `database/friends_cafe_preserve_data_setup.sql` in Workbench. It creates missing tables and adds only missing starter employees, customers, and menu items; it does not insert demo orders or payments.
2. In VS Code, open a terminal at the project root and create your private configuration file by running:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Open `.env` in VS Code and set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` to the values for your Workbench connection and already-selected schema. Keep `.env` private; it is excluded by `.gitignore`.
4. In that same project-root terminal, start the application:

   ```powershell
   npm start
   ```

   This uses Node.js 20.18 or newer to load `.env` when present. Leave the terminal open while you use the app.
5. Open `http://localhost:5000/api/health`. It should show `"database":"connected"`. Then open `http://localhost:5000/api/menu`; it should return every menu row, including unavailable items. To see the menu, open `http://localhost:5000/menu.html` or `http://localhost:5000/index.html#menu`. The site root (`http://localhost:5000`) opens the management dashboard.

The frontend and API are served by the same Express process. The connection is **browser → Express API → MySQL Server**; the browser never connects directly to MySQL. You can also open `frontend/index.html` with VS Code Live Server (usually `http://127.0.0.1:5500`); leave the backend running with `npm start`. Do not open the HTML files directly from disk. If the menu shows an error, verify `http://localhost:5000/api/health` first, then check `http://localhost:5000/api/menu`.

The first employee seeded in the database is used as the order handler. New orders (including all their item lines) are saved as pending; the payment screen looks up the server-calculated total and records the selected payment method. This is a database demonstration only, not a real payment gateway.

## API

- `GET /api/health` — application and database status
- `GET /api/dashboard` — summary metrics and analytics
- `GET /api/menu` — all menu items, including availability
- `POST /api/menu`, `PUT /api/menu/:id`, `DELETE /api/menu/:id` — menu management; delete marks an item unavailable
- `GET /api/orders?search=...&status=...&limit=...` — order history (max 200)
- `POST /api/customers`, `GET /api/customers`, `GET /api/customers/:id`, `DELETE /api/customers/:id` — customer records and directory; deleting a customer also deletes their orders and payment records
- `POST /api/contact` — responds with `501` because the supplied schema has no `contact_messages` table
- `POST /api/orders` — accepts an `items` array of item IDs and quantities (also retains the legacy single-item request format)
- `GET /api/orders/:id` — order lines, total, and payment status for billing
- `POST /api/payments`

Run `npm run check` for JavaScript syntax checks.
