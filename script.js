const localHosts = ["localhost", "127.0.0.1"];
const isLiveServer = localHosts.includes(window.location.hostname) &&
    window.location.port !== "5000";
const API = isLiveServer
    ? `${window.location.protocol}//${window.location.hostname}:5000/api`
    : "/api";
let menuItems = [];
let cartItems = [];

const MENU_IMAGES = {
    "cappuccino": {
        src: "https://images.pexels.com/photos/6747870/pexels-photo-6747870.jpeg?auto=compress&cs=tinysrgb&w=900",
        alt: "Freshly prepared cappuccino"
    },
    "cold coffee": {
        src: "https://images.pexels.com/photos/33542190/pexels-photo-33542190/free-photo-of-chilled-iced-coffee-on-wooden-table-outdoors.jpeg?auto=compress&cs=tinysrgb&w=900",
        alt: "Chilled iced coffee"
    },
    "masala tea": {
        src: "https://images.pexels.com/photos/34324342/pexels-photo-34324342/free-photo-of-street-vendor-pouring-traditional-chai.jpeg?auto=compress&cs=tinysrgb&w=900",
        alt: "Traditional chai being poured"
    },
    "fresh lime juice": {
        src: "https://images.pexels.com/photos/17903466/pexels-photo-17903466/free-photo-of-person-squeezing-a-fruit.jpeg?auto=compress&cs=tinysrgb&w=900",
        alt: "Fresh lime being squeezed"
    },
    "veg sandwich": {
        src: "https://images.pexels.com/photos/35658543/pexels-photo-35658543/free-photo-of-healthy-lunch-with-grilled-sandwich-and-salad.jpeg?auto=compress&cs=tinysrgb&w=900",
        alt: "Grilled vegetable sandwich"
    },
    "cheese sandwich": {
        src: "https://images.pexels.com/photos/11256670/pexels-photo-11256670.jpeg?auto=compress&cs=tinysrgb&w=900",
        alt: "Toasted cheese sandwich"
    },
    "french fries": {
        src: "https://images.pexels.com/photos/5779487/pexels-photo-5779487.jpeg?auto=compress&cs=tinysrgb&w=900",
        alt: "Crispy golden French fries"
    },
    "veg burger": {
        src: "https://images.pexels.com/photos/34407507/pexels-photo-34407507/free-photo-of-juicy-gourmet-burger-on-dark-background.jpeg?auto=compress&cs=tinysrgb&w=900",
        alt: "Freshly made gourmet burger"
    },
    "chicken burger": {
        src: "https://images.pexels.com/photos/9207184/pexels-photo-9207184.jpeg?auto=compress&cs=tinysrgb&w=900",
        alt: "Chicken burger"
    },
    "pizza": {
        src: "https://images.pexels.com/photos/6068717/pexels-photo-6068717.jpeg?auto=compress&cs=tinysrgb&w=900",
        alt: "Freshly baked pizza"
    },
    "chocolate cake": {
        src: "https://images.pexels.com/photos/18613262/pexels-photo-18613262/free-photo-of-hand-placing-fruit-on-cake.jpeg?auto=compress&cs=tinysrgb&w=900",
        alt: "Chocolate cake"
    },
    "brownie": {
        src: "https://images.pexels.com/photos/15106329/pexels-photo-15106329/free-photo-of-delicious-chocolate-cake-on-black-plate.jpeg?auto=compress&cs=tinysrgb&w=900",
        alt: "Rich chocolate brownie"
    },
    "ice cream": {
        src: "https://images.pexels.com/photos/7761650/pexels-photo-7761650.jpeg?auto=compress&cs=tinysrgb&w=900",
        alt: "Scoop of ice cream"
    }
};

const CATEGORY_IMAGES = {
    beverage: MENU_IMAGES.cappuccino,
    snacks: MENU_IMAGES["veg sandwich"],
    "fast food": MENU_IMAGES.pizza,
    dessert: MENU_IMAGES["chocolate cake"]
};

const MENU_PREVIEW = [
    { item_id: 1, item_name: "Cappuccino", category: "Beverage", price: 120 },
    { item_id: 2, item_name: "Cold Coffee", category: "Beverage", price: 100 },
    { item_id: 3, item_name: "Masala Tea", category: "Beverage", price: 60 },
    { item_id: 4, item_name: "Fresh Lime Juice", category: "Beverage", price: 80 },
    { item_id: 5, item_name: "Veg Sandwich", category: "Snacks", price: 90 },
    { item_id: 6, item_name: "Cheese Sandwich", category: "Snacks", price: 120 },
    { item_id: 7, item_name: "French Fries", category: "Snacks", price: 100 },
    { item_id: 8, item_name: "Veg Burger", category: "Fast Food", price: 150 },
    { item_id: 9, item_name: "Chicken Burger", category: "Fast Food", price: 180 },
    { item_id: 10, item_name: "Pizza", category: "Fast Food", price: 200 },
    { item_id: 11, item_name: "Chocolate Cake", category: "Dessert", price: 130 },
    { item_id: 12, item_name: "Brownie", category: "Dessert", price: 110 },
    { item_id: 13, item_name: "Ice Cream", category: "Dessert", price: 90 }
];

async function apiRequest(url, options) {
    let response;
    try {
        response = await fetch(API + url, { credentials: "include", ...options });
    } catch (error) {
        if (error instanceof TypeError) {
            throw new Error(`The café API is not reachable at ${API}. Start it from the project folder with npm start and check that MySQL is running.`);
        }
        throw error;
    }

    let data;
    try {
        data = await response.json();
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new Error(`The café server returned an invalid response (${response.status}). Start the backend with npm start and open the page through http://localhost:5000 or VS Code Live Server.`);
        }
        throw error;
    }
    if (!response.ok) throw new Error(data.error || "Request failed.");
    return data;
}

function showMessage(element, message, success) {
    if (!element) return;
    element.textContent = message;
    element.className = success ? "notice success" : "notice error";
}

function jsonOptions(method, body) {
    return {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    };
}

function makeTextElement(tag, text, className) {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    return element;
}

function formatCurrency(value) {
    return `₹${Number(value || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? String(value)
        : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function statusBadge(status) {
    const badge = makeTextElement("span", status || "Unpaid", "status-badge");
    badge.classList.add((status || "unpaid").toLowerCase().replace(/\s+/g, "-"));
    return badge;
}

function tableCell(text, className) {
    return makeTextElement("td", text == null || text === "" ? "—" : String(text), className);
}

function isMenuItemAvailable(item) {
    return item.availability === true || Number(item.availability) === 1;
}

function renderMenuCards(container, items, allowOrdering, preview = false) {
    items.forEach(item => {
        const available = isMenuItemAvailable(item);
        const category = String(item.category || "Other").toLowerCase().trim();
        const icon = category.includes("beverage") ? "☕"
            : category.includes("snack") ? "🥪"
                : category.includes("dessert") ? "🍰"
                    : category.includes("fast") ? "🍔" : "🍽️";
        const normalizedName = String(item.item_name || "").toLowerCase().trim();
        const image = MENU_IMAGES[normalizedName] || CATEGORY_IMAGES[category] || MENU_IMAGES.cappuccino;
        const card = document.createElement("article");
        card.className = "menu-card";
        const imageFrame = document.createElement("div");
        imageFrame.className = "menu-card-image";
        imageFrame.style.setProperty("--menu-image-color", category.includes("dessert") ? "#744d3c" : category.includes("beverage") ? "#92714f" : "#69765c");
        const imageElement = document.createElement("img");
        imageElement.src = image.src;
        imageElement.alt = image.alt || `${item.item_name} menu item`;
        imageElement.loading = "lazy";
        imageElement.decoding = "async";
        imageElement.addEventListener("error", () => {
            imageFrame.classList.add("image-fallback");
            imageElement.remove();
        }, { once: true });
        imageFrame.append(imageElement, makeTextElement("span", icon, "menu-image-fallback-icon"));

        const content = document.createElement("div");
        content.className = "menu-card-content";
        content.append(
            makeTextElement("p", item.category || "Café favourite", "menu-category"),
            makeTextElement("h3", item.item_name),
            makeTextElement("p", formatCurrency(item.price), "price")
        );

        const cardFooter = document.createElement("div");
        cardFooter.className = "menu-card-footer";
        if (!allowOrdering) {
            cardFooter.append(makeTextElement("span", preview ? "Preview · database offline" : "Available to order", "menu-availability unavailable"));
        } else {
            cardFooter.append(makeTextElement("span", available ? "Available today" : "Currently unavailable", available ? "menu-availability available" : "menu-availability unavailable"));
            const button = makeTextElement("button", available ? "Order now" : "Unavailable");
            button.type = "button";
            button.disabled = !available;
            button.addEventListener("click", () => {
                if (!available) return;
                const orderSelect = document.getElementById("item");
                const orderSection = document.getElementById("new-order");
                if (orderSelect && orderSection) {
                    orderSelect.value = String(item.item_id);
                    orderSection.scrollIntoView({ behavior: "smooth", block: "start" });
                    return;
                }
                localStorage.setItem("selectedItemId", item.item_id);
                window.location.href = "order.html";
            });
            cardFooter.append(button);
        }

        card.append(imageFrame, content, cardFooter);
        container.append(card);
    });
}

function updateCart() {
    const summary = document.getElementById("cartSummary");
    const totalElement = document.getElementById("cartTotal");
    const orderButton = document.getElementById("bookOrder");
    if (!summary || !totalElement || !orderButton) return;
    summary.replaceChildren();
    if (!cartItems.length) {
        summary.append(makeTextElement("p", "Your order is empty.", "table-empty"));
        totalElement.textContent = formatCurrency(0);
        orderButton.disabled = true;
        return;
    }
    const table = document.createElement("table");
    table.innerHTML = "<thead><tr><th>ITEM</th><th>QTY</th><th>PRICE</th><th>SUBTOTAL</th><th></th></tr></thead>";
    const body = document.createElement("tbody");
    let total = 0;
    cartItems.forEach((cartItem, index) => {
        const lineTotal = cartItem.price * cartItem.quantity;
        total += lineTotal;
        const row = document.createElement("tr");
        row.append(
            tableCell(cartItem.item_name),
            tableCell(cartItem.quantity),
            tableCell(formatCurrency(cartItem.price)),
            tableCell(formatCurrency(lineTotal), "amount-cell")
        );
        const action = document.createElement("td");
        const remove = makeTextElement("button", "Remove", "text-link cart-remove");
        remove.type = "button";
        remove.setAttribute("aria-label", `Remove ${cartItem.item_name} from the order`);
        remove.addEventListener("click", () => {
            cartItems.splice(index, 1);
            updateCart();
        });
        action.append(remove);
        row.append(action);
        body.append(row);
    });
    table.append(body);
    summary.append(table);
    totalElement.textContent = formatCurrency(total);
    orderButton.disabled = false;
}

function renderMenuAdmin(items) {
    const table = document.getElementById("menuAdminTable");
    if (!table) return;
    table.replaceChildren();
    if (!items.length) {
        const row = document.createElement("tr");
        const cell = makeTextElement("td", "No menu items are in the database.", "table-empty");
        cell.colSpan = 5;
        row.append(cell);
        table.append(row);
        return;
    }
    items.forEach(item => {
        const row = document.createElement("tr");
        row.append(
            tableCell(item.item_name),
            tableCell(item.category),
            tableCell(formatCurrency(item.price), "amount-cell"),
            tableCell(isMenuItemAvailable(item) ? "Available" : "Unavailable")
        );
        const actions = document.createElement("td");
        const edit = makeTextElement("button", "Edit", "text-link");
        edit.type = "button";
        edit.addEventListener("click", () => {
            document.getElementById("menuItemId").value = item.item_id;
            document.getElementById("menuItemName").value = item.item_name;
            document.getElementById("menuCategory").value = item.category;
            document.getElementById("menuPrice").value = Number(item.price).toFixed(2);
            document.getElementById("menuAvailability").checked = isMenuItemAvailable(item);
            document.getElementById("saveMenuItem").textContent = "Save changes";
            document.getElementById("cancelMenuEdit").hidden = false;
            document.getElementById("menuItemName").focus();
        });
        actions.append(edit);
        if (isMenuItemAvailable(item)) {
            const remove = makeTextElement("button", "Remove", "text-link menu-remove");
            remove.type = "button";
            remove.addEventListener("click", async () => {
                if (!window.confirm(`Remove ${item.item_name} from the available menu? Past order records will be kept.`)) return;
                try {
                    await apiRequest(`/menu/${encodeURIComponent(item.item_id)}`, { method: "DELETE" });
                    showMessage(document.getElementById("menuAdminNotice"), "Menu item removed from ordering.", true);
                    await loadMenu();
                } catch (error) {
                    showMessage(document.getElementById("menuAdminNotice"), error.message, false);
                }
            });
            actions.append(" · ", remove);
        }
        row.append(actions);
        table.append(row);
    });
}

function renderReceipt(order) {
    const lineRows = order.items.map(item => `
        <tr><td>${escapeHtml(item.item_name || "Menu item")}</td>
        <td>${Number(item.quantity)}</td><td>${formatCurrency(item.price)}</td>
        <td>${formatCurrency(item.line_total)}</td></tr>`).join("");
    const payment = order.payment_status === "Paid"
        ? `Paid via ${escapeHtml(order.payment_method || "Recorded payment")}`
        : "Payment pending";
    return `<!doctype html><html lang="en"><head><meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Friends Café · Bill #${Number(order.order_id)}</title>
        <style>
            body{max-width:720px;margin:36px auto;padding:24px;color:#28231f;font:14px/1.5 Arial,sans-serif}
            header{text-align:center;border-bottom:2px solid #684630;padding-bottom:18px}
            h1{margin:0;color:#684630}header p{margin:5px}
            .meta{display:flex;justify-content:space-between;margin:22px 0}
            table{width:100%;border-collapse:collapse}th,td{padding:10px 8px;border-bottom:1px solid #e8e2da;text-align:left}
            th{color:#766c62;font-size:11px}td:last-child,th:last-child{text-align:right}
            .total{text-align:right;font-size:19px;font-weight:bold;margin-top:18px}
            .payment{text-align:right;color:#477957;font-weight:bold}
            .print{display:block;margin:24px auto;padding:10px 18px;border:0;border-radius:7px;color:#fff;background:#684630;cursor:pointer}
            footer{margin-top:34px;text-align:center;color:#827a72}
            @media print{body{margin:0;padding:12px}.print{display:none}}
        </style></head><body><header><h1>Friends Café</h1><p>Order bill</p></header>
        <div class="meta"><span>Bill #${Number(order.order_id)}</span><span>${escapeHtml(formatDate(order.order_date))}</span></div>
        <p>Customer: <strong>${escapeHtml(order.customer_name)}</strong></p>
        <table><thead><tr><th>ITEM</th><th>QTY</th><th>PRICE</th><th>SUBTOTAL</th></tr></thead>
        <tbody>${lineRows}</tbody></table>
        <p class="total">Total: ${formatCurrency(order.total_amount)}</p>
        <p class="payment">${payment}</p><button class="print" onclick="window.print()">Print bill</button>
        <footer>Thank you for visiting Friends Café.</footer></body></html>`;
}

async function printReceipt(orderId) {
    const printWindow = window.open("", "_blank", "width=760,height=850");
    if (!printWindow) {
        showMessage(document.getElementById("ordersNotice"), "Allow pop-ups to open a printable bill.", false);
        return;
    }
    try {
        const order = await apiRequest(`/orders/${encodeURIComponent(orderId)}`);
        printWindow.document.open();
        printWindow.document.write(renderReceipt(order));
        printWindow.document.close();
    } catch (error) {
        printWindow.close();
        showMessage(document.getElementById("ordersNotice"), error.message, false);
    }
}

// Normalize order items into a readable string. Handles:
// - string (already formatted)
// - array of strings or objects { item_name, quantity }
// - single object { item_name, quantity }
function formatOrderItems(items) {
    if (!items) return "—";
    if (typeof items === "string") return items;
    if (Array.isArray(items)) {
        return items.map(it => {
            if (!it) return "—";
            if (typeof it === "string") return it;
            const name = it.item_name || it.name || it.title || "Item";
            const qty = it.quantity != null ? ` × ${it.quantity}` : "";
            return `${name}${qty}`;
        }).join(", ");
    }
    if (typeof items === "object") {
        const name = items.item_name || items.name || items.title || "Item";
        const qty = items.quantity != null ? ` × ${items.quantity}` : "";
        return `${name}${qty}`;
    }
    return String(items);
}

async function loadOrders(search = "", status = "") {
    const table = document.getElementById("ordersTable");
    if (!table) return;
    const loadingRow = document.createElement("tr");
    const loadingCell = makeTextElement("td", "Loading orders…", "table-empty");
    loadingCell.colSpan = 8;
    loadingRow.append(loadingCell);
    table.replaceChildren(loadingRow);
    try {
        const params = new URLSearchParams({ limit: "100" });
        if (search.trim()) params.set("search", search.trim());
        if (status) params.set("status", status);
        const orders = await apiRequest(`/orders?${params}`);
        table.replaceChildren();
        if (!orders.length) {
            const empty = document.createElement("tr");
            const cell = makeTextElement("td", "No orders match your search.", "table-empty");
            cell.colSpan = 8;
            empty.append(cell);
            table.append(empty);
            return;
        }
        orders.forEach(order => {
            const tr = document.createElement("tr");
            tr.append(
                tableCell(`#${order.order_id}`, "id-cell"),
                tableCell(formatDate(order.order_date)),
                tableCell(order.customer_name),
                tableCell(formatOrderItems(order.items)),
                tableCell(formatCurrency(order.total_amount), "amount-cell")
            );
            const orderStatus = document.createElement("td");
            orderStatus.append(statusBadge(order.order_status));
            tr.append(orderStatus);
            const paymentStatus = document.createElement("td");
            paymentStatus.append(statusBadge(order.payment_status));
            tr.append(paymentStatus);
            const actions = document.createElement("td");
            const print = makeTextElement("button", "Bill", "text-link");
            print.type = "button";
            print.addEventListener("click", () => printReceipt(order.order_id));
            actions.append(print);
            if (order.payment_status !== "Paid") {
                const payLink = makeTextElement("a", "Pay →", "text-link");
                payLink.href = `index.html?order_id=${encodeURIComponent(order.order_id)}#payments`;
                payLink.style.marginLeft = "8px";
                actions.append(payLink);
            }
            tr.append(actions);
            table.append(tr);
        });
    } catch (error) {
        console.error("Order history loading failed:", error);
        table.replaceChildren();
        const empty = document.createElement("tr");
        const cell = makeTextElement("td", error.message, "table-empty error-text");
        cell.colSpan = 8;
        empty.append(cell);
        table.append(empty);
    }
}

async function loadCustomers(search = "") {
    const table = document.getElementById("customersTable");
    if (!table) return;
    try {
        const params = new URLSearchParams();
        if (search.trim()) params.set("search", search.trim());
        const customers = await apiRequest(`/customers${params.size ? `?${params}` : ""}`);
        table.replaceChildren();
        if (!customers.length) {
            const row = document.createElement("tr");
            const cell = makeTextElement("td", "No customers found.", "table-empty");
            cell.colSpan = 6;
            row.append(cell);
            table.append(row);
            return;
        }
        customers.forEach(customer => {
            const row = document.createElement("tr");
            row.append(
                tableCell(`#${customer.customer_id}`, "id-cell"),
                tableCell(customer.customer_name),
                tableCell(customer.phone),
                tableCell(customer.email),
                tableCell(`${customer.orders_count} orders · ${formatCurrency(customer.total_spent)}`)
            );
            const actions = document.createElement("td");
            const deleteButton = makeTextElement("button", "Delete customer", "text-link customer-delete");
            deleteButton.type = "button";
            deleteButton.addEventListener("click", async () => {
                const orderCount = Number(customer.orders_count);
                const orderWarning = orderCount
                    ? ` This will also permanently delete ${orderCount} linked order${orderCount === 1 ? "" : "s"}, their items, and payment records.`
                    : "";
                if (!window.confirm(`Delete customer ${customer.customer_name} and all their details?${orderWarning} This cannot be undone.`)) return;
                deleteButton.disabled = true;
                try {
                    const result = await apiRequest(`/customers/${encodeURIComponent(customer.customer_id)}`, {
                        method: "DELETE"
                    });
                    showMessage(
                        document.getElementById("customerResult"),
                        `Customer deleted${result.deleted_orders ? ` with ${result.deleted_orders} linked order${result.deleted_orders === 1 ? "" : "s"}` : ""}.`,
                        true
                    );
                    await Promise.all([
                        loadCustomers(search),
                        loadOrders(),
                        loadDashboard()
                    ]);
                } catch (error) {
                    showMessage(document.getElementById("customerResult"), error.message, false);
                    deleteButton.disabled = false;
                }
            });
            actions.append(deleteButton);
            row.append(actions);
            table.append(row);
        });
    } catch (error) {
        console.error("Customer list loading failed:", error);
        table.replaceChildren();
        const row = document.createElement("tr");
        const cell = makeTextElement("td", error.message, "table-empty error-text");
        cell.colSpan = 6;
        row.append(cell);
        table.append(row);
    }
}

async function loadDashboard() {
    if (!document.getElementById("statRevenue")) return;
    try {
        const dashboard = await apiRequest("/dashboard");
        const summary = dashboard.summary;
        document.getElementById("statRevenue").textContent = formatCurrency(summary.revenue);
        document.getElementById("statToday").textContent = formatCurrency(summary.today_revenue);
        document.getElementById("statOrders").textContent = Number(summary.orders).toLocaleString("en-IN");
        document.getElementById("statPending").textContent = Number(summary.pending_orders).toLocaleString("en-IN");
        document.getElementById("statCustomers").textContent = Number(summary.customers).toLocaleString("en-IN");
        document.getElementById("statMenuItems").textContent = Number(summary.menu_items).toLocaleString("en-IN");

        const chart = document.getElementById("salesChart");
        chart.replaceChildren();
        const maxRevenue = Math.max(1, ...dashboard.daily_sales.map(day => Number(day.total_revenue)));
        dashboard.daily_sales.forEach(day => {
            const column = document.createElement("div");
            column.className = "chart-column";
            const value = makeTextElement("span", formatCurrency(day.total_revenue), "chart-value");
            const bar = document.createElement("div");
            bar.className = "chart-bar";
            bar.style.height = `${Math.max(5, Number(day.total_revenue) / maxRevenue * 100)}%`;
            bar.title = `${Number(day.total_orders)} orders · ${formatCurrency(day.total_revenue)}`;
            column.append(value, bar, makeTextElement("span", new Date(day.sales_date).toLocaleDateString("en-IN", { weekday: "short" }), "chart-label"));
            chart.append(column);
        });
        if (!dashboard.daily_sales.length) {
            chart.append(makeTextElement("p", "Sales data will appear here after the first order.", "table-empty"));
        }

        const popular = document.getElementById("popularItems");
        popular.replaceChildren();
        dashboard.top_items.forEach((item, index) => {
            const entry = document.createElement("div");
            entry.className = "rank-entry";
            entry.append(
                makeTextElement("span", String(index + 1).padStart(2, "0"), "rank-number"),
                makeTextElement("span", item.item_name, "rank-title"),
                makeTextElement("span", `${Number(item.total_quantity_sold)} sold`, "rank-meta")
            );
            popular.append(entry);
        });
        if (!dashboard.top_items.length) popular.append(makeTextElement("p", "Menu sales will appear here.", "table-empty"));

        const customers = document.getElementById("topCustomers");
        customers.replaceChildren();
        dashboard.top_customers.forEach((customer, index) => {
            const entry = document.createElement("div");
            entry.className = "rank-entry";
            entry.append(
                makeTextElement("span", String(index + 1).padStart(2, "0"), "rank-number"),
                makeTextElement("span", customer.customer_name, "rank-title"),
                makeTextElement("span", formatCurrency(customer.total_spent), "rank-meta")
            );
            customers.append(entry);
        });
        if (!dashboard.top_customers.length) customers.append(makeTextElement("p", "Customer spending will appear here.", "table-empty"));
        await loadOrdersForDashboard();
    } catch (error) {
        console.error("Dashboard loading failed:", error);
        showMessage(document.getElementById("dashboardNotice"), error.message, false);
    }
}

async function loadOrdersForDashboard() {
    const table = document.getElementById("recentOrders");
    if (!table) return;
    try {
        const orders = await apiRequest("/orders?limit=5");
        table.replaceChildren();
        if (!orders.length) {
            const row = document.createElement("tr");
            const cell = makeTextElement("td", "No orders yet. Create the first one to get started.", "table-empty");
            cell.colSpan = 5;
            row.append(cell);
            table.append(row);
            return;
        }
        orders.forEach(order => {
            const row = document.createElement("tr");
            row.append(
                tableCell(`#${order.order_id}`, "id-cell"),
                tableCell(order.customer_name),
                tableCell(formatOrderItems(order.items)),
                tableCell(formatCurrency(order.total_amount), "amount-cell")
            );
            const status = document.createElement("td");
            status.append(statusBadge(order.order_status));
            row.append(status);
            table.append(row);
        });
    } catch (error) {
        table.replaceChildren();
        const row = document.createElement("tr");
        const cell = makeTextElement("td", error.message, "table-empty error-text");
        cell.colSpan = 5;
        row.append(cell);
        table.append(row);
    }
}

async function loadMenu() {
    const container = document.getElementById("menu-container");
    const select = document.getElementById("item");
    if (!container && !select) return;
    try {
        const items = await apiRequest("/menu");
        menuItems = items;
        if (container) {
            container.replaceChildren();
            if (!items.length) {
                container.append(makeTextElement("p", "There are no menu items in the database yet.", "table-empty"));
            } else {
                const canOrder = document.body.classList.contains("public-interior") ||
                    document.body.classList.contains("management-page") ||
                    document.body.classList.contains("app-page");
                renderMenuCards(container, items, canOrder);
            }
        }
        renderMenuAdmin(items);

        if (select) {
            select.replaceChildren(new Option(items.length ? "Select an item" : "No menu items available", ""));
            items.forEach(item => {
                const option = new Option(
                    `${item.item_name} - ${formatCurrency(item.price)}${isMenuItemAvailable(item) ? "" : " (Unavailable)"}`,
                    item.item_id
                );
                option.disabled = !isMenuItemAvailable(item);
                select.add(option);
            });
            const selected = localStorage.getItem("selectedItemId");
            if (selected && items.some(item => String(item.item_id) === selected)) {
                select.value = selected;
                localStorage.removeItem("selectedItemId");
            }
        }
        updateCart();
    } catch (error) {
        console.error("Menu loading failed:", error);
        if (container) {
            const message = makeTextElement("p", `${error.message} Showing the supplied menu as a preview; ordering requires a database connection.`, "notice error menu-load-error");
            container.replaceChildren(message);
            renderMenuCards(container, MENU_PREVIEW, false, true);
        }
        if (select) select.replaceChildren(new Option("Menu unavailable", ""));
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadMenu();

    const navToggle = document.querySelector(".nav-toggle");
    if (navToggle) {
        const navigation = document.querySelector(".site-nav");
        navToggle.addEventListener("click", () => {
            const open = navigation.classList.toggle("nav-open");
            navToggle.setAttribute("aria-expanded", String(open));
        });
        navigation.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener("click", () => {
                navigation.querySelectorAll("a").forEach(navLink => navLink.classList.remove("active"));
                link.classList.add("active");
                navigation.classList.remove("nav-open");
                navToggle.setAttribute("aria-expanded", "false");
            });
        });
    }

    const orderSearch = document.getElementById("orderSearch");
    const orderStatusFilter = document.getElementById("orderStatusFilter");
    if (orderSearch) {
        let searchTimer;
        orderSearch.addEventListener("input", () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => loadOrders(orderSearch.value, orderStatusFilter.value), 250);
        });
        orderStatusFilter.addEventListener("change", () => loadOrders(orderSearch.value, orderStatusFilter.value));
        document.getElementById("refreshOrders").addEventListener("click", () => loadOrders(orderSearch.value, orderStatusFilter.value));
    }

    const customerSearch = document.getElementById("customerSearch");
    if (customerSearch) {
        let searchTimer;
        customerSearch.addEventListener("input", () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => loadCustomers(customerSearch.value), 250);
        });
    }

    const customerForm = document.getElementById("customerForm");
    if (customerForm) {
        customerForm.addEventListener("submit", async event => {
            event.preventDefault();
            const result = document.getElementById("customerResult");
            const submit = customerForm.querySelector('button[type="submit"]');
            submit.disabled = true;
            try {
                const customer = await apiRequest("/customers", jsonOptions("POST", {
                    customer_name: document.getElementById("custName").value.trim(),
                    phone: document.getElementById("custPhone").value.trim(),
                    email: document.getElementById("custEmail").value.trim()
                }));
                showMessage(result, `Customer registered. Your customer ID is ${customer.customer_id}.`, true);
                customerForm.reset();
                await loadCustomers();
            } catch (error) {
                showMessage(result, error.message, false);
            } finally {
                submit.disabled = false;
            }
        });
    }

    const contactForm = document.getElementById("contactForm");
    if (contactForm) {
        contactForm.addEventListener("submit", async event => {
            event.preventDefault();
            const result = document.getElementById("contactResult");
            const submit = contactForm.querySelector('button[type="submit"]');
            submit.disabled = true;
            try {
                const response = await apiRequest("/contact", jsonOptions("POST", {
                    name: document.getElementById("name").value.trim(),
                    email: document.getElementById("email").value.trim(),
                    message: document.getElementById("message").value.trim()
                }));
                showMessage(result, response.message, true);
                contactForm.reset();
            } catch (error) {
                showMessage(result, error.message, false);
            } finally {
                submit.disabled = false;
            }
        });
    }

    const findButton = document.getElementById("findCustomer");
    if (findButton) {
        findButton.addEventListener("click", async () => {
            const id = document.getElementById("customerId").value.trim();
            const details = document.getElementById("customerDetails");
            try {
                const customer = await apiRequest(`/customers/${encodeURIComponent(id)}`);
                details.style.display = "flex";
                document.getElementById("customerName").textContent = customer.customer_name;
                document.getElementById("customerPhone").textContent = customer.phone || "Not available";
                document.getElementById("customerEmail").textContent = customer.email || "Not available";
                showMessage(document.getElementById("orderResult"), "", true);
            } catch (error) {
                details.style.display = "none";
                showMessage(document.getElementById("orderResult"), error.message, false);
            }
        });
    }

    const addCartItem = document.getElementById("addCartItem");
    if (addCartItem) {
        addCartItem.addEventListener("click", () => {
            const itemId = Number(document.getElementById("item").value);
            const quantity = Number(document.getElementById("quantity").value);
            const item = menuItems.find(menuItem => Number(menuItem.item_id) === itemId);
            if (!item || !isMenuItemAvailable(item) || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
                showMessage(document.getElementById("orderResult"), "Choose an available item and a quantity from 1 to 99.", false);
                return;
            }
            const existing = cartItems.find(cartItem => Number(cartItem.item_id) === itemId);
            if (existing) {
                if (existing.quantity + quantity > 99) {
                    showMessage(document.getElementById("orderResult"), "The quantity for an item cannot exceed 99.", false);
                    return;
                }
                existing.quantity += quantity;
            } else {
                cartItems.push({
                    item_id: item.item_id,
                    item_name: item.item_name,
                    price: Number(item.price),
                    quantity
                });
            }
            document.getElementById("orderResult").replaceChildren();
            updateCart();
        });
    }

    const orderButton = document.getElementById("bookOrder");
    if (orderButton) {
        orderButton.addEventListener("click", async () => {
            const result = document.getElementById("orderResult");
            orderButton.disabled = true;
            try {
                const orderDetails = document.getElementById("addCartItem")
                    ? { items: cartItems.map(item => ({ item_id: item.item_id, quantity: item.quantity })) }
                    : {
                        item_id: Number(document.getElementById("item").value),
                        quantity: Number(document.getElementById("quantity").value)
                    };
                const order = await apiRequest("/orders", jsonOptions("POST", {
                    customer_id: Number(document.getElementById("customerId").value),
                    ...orderDetails
                }));
                result.replaceChildren();
                const box = document.createElement("div");
                box.className = "success-box";
                box.append(
                    makeTextElement("h2", "Order placed!"),
                    makeTextElement("p", `Order ID: ${order.order_id}`),
                    makeTextElement("p", `Items: ${order.items.map(item => `${item.item_name} × ${item.quantity}`).join(", ")}`),
                    makeTextElement("p", `Total: ₹${Number(order.total_amount).toFixed(2)}`),
                    makeTextElement("p", "Status: Awaiting payment")
                );
                const link = document.createElement("a");
                link.href = `index.html?order_id=${encodeURIComponent(order.order_id)}#payments`;
                link.className = "btn";
                link.textContent = "Continue to payment";
                const printButton = makeTextElement("button", "Print bill", "button button-secondary");
                printButton.type = "button";
                printButton.addEventListener("click", () => printReceipt(order.order_id));
                box.append(link, printButton);
                result.append(box);
                cartItems = [];
                updateCart();
                await loadOrders();
                await loadDashboard();
            } catch (error) {
                showMessage(result, error.message, false);
            } finally {
                orderButton.disabled = false;
            }
        });
    }

    const paymentForm = document.getElementById("paymentForm");
    if (paymentForm) {
        const orderId = document.getElementById("orderId");
        const amount = document.getElementById("amount");
        const result = document.getElementById("paymentResult");
        const payButton = paymentForm.querySelector('button[type="submit"]');
        let loadedOrderId = "";

        orderId.addEventListener("input", () => {
            if (loadedOrderId === orderId.value.trim()) return;
            loadedOrderId = "";
            amount.value = "";
            payButton.disabled = true;
            if (orderId.value.trim()) {
                showMessage(result, "Look up this order to load its total.", true);
            } else {
                result.replaceChildren();
            }
        });

        const findOrder = async () => {
            const id = orderId.value.trim();
            if (!id) {
                loadedOrderId = "";
                amount.value = "";
                payButton.disabled = true;
                return;
            }
            try {
                const order = await apiRequest(`/orders/${encodeURIComponent(id)}`);
                amount.value = Number(order.total_amount).toFixed(2);
                loadedOrderId = id;
                if (order.payment_status === "Paid") {
                    showMessage(result, `Order ${id} is already paid (${order.payment_method}).`, true);
                    payButton.disabled = true;
                } else {
                    showMessage(result, `Order total: ₹${amount.value}. Select a payment method to continue.`, true);
                    payButton.disabled = false;
                }
            } catch (error) {
                loadedOrderId = "";
                amount.value = "";
                showMessage(result, error.message, false);
            }
        };

        orderId.addEventListener("change", findOrder);
        orderId.addEventListener("blur", findOrder);
        const queryOrderId = new URLSearchParams(window.location.search).get("order_id");
        if (queryOrderId) {
            orderId.value = queryOrderId;
        }

        paymentForm.addEventListener("submit", async event => {
            event.preventDefault();
            if (loadedOrderId !== orderId.value.trim()) {
                showMessage(result, "Look up a valid order before paying.", false);
                return;
            }
            payButton.disabled = true;
            try {
                const payment = await apiRequest("/payments", jsonOptions("POST", {
                    order_id: Number(orderId.value),
                    amount: Number(amount.value),
                    payment_method: document.getElementById("paymentMethod").value
                }));
                result.replaceChildren();
                showMessage(result, `Payment successful. Payment ID: ${payment.payment_id}. Order ${payment.order_id} is confirmed.`, true);
                const printButton = makeTextElement("button", "Print paid bill", "button button-secondary");
                printButton.type = "button";
                printButton.addEventListener("click", () => printReceipt(payment.order_id));
                result.append(printButton);
                await loadOrders();
                await loadDashboard();
            } catch (error) {
                showMessage(result, error.message, false);
                payButton.disabled = false;
            }
        });
    }

    const menuForm = document.getElementById("menuForm");
    if (menuForm) {
        menuForm.addEventListener("submit", async event => {
            event.preventDefault();
            const id = document.getElementById("menuItemId").value;
            const data = {
                item_name: document.getElementById("menuItemName").value.trim(),
                category: document.getElementById("menuCategory").value.trim(),
                price: Number(document.getElementById("menuPrice").value),
                availability: document.getElementById("menuAvailability").checked
            };
            const submit = document.getElementById("saveMenuItem");
            submit.disabled = true;
            try {
                await apiRequest(id ? `/menu/${encodeURIComponent(id)}` : "/menu", jsonOptions(id ? "PUT" : "POST", data));
                showMessage(document.getElementById("menuAdminNotice"), id ? "Menu item updated." : "Menu item added.", true);
                menuForm.reset();
                document.getElementById("menuAvailability").checked = true;
                document.getElementById("menuItemId").value = "";
                submit.textContent = "Add menu item";
                document.getElementById("cancelMenuEdit").hidden = true;
                await loadMenu();
            } catch (error) {
                showMessage(document.getElementById("menuAdminNotice"), error.message, false);
            } finally {
                submit.disabled = false;
            }
        });
        document.getElementById("cancelMenuEdit").addEventListener("click", () => {
            menuForm.reset();
            document.getElementById("menuAvailability").checked = true;
            document.getElementById("menuItemId").value = "";
            document.getElementById("saveMenuItem").textContent = "Add menu item";
            document.getElementById("cancelMenuEdit").hidden = true;
        });
    }

    loadOrders();
    loadOrdersForDashboard();
    loadCustomers();
    loadDashboard();

    const orderId = document.getElementById("orderId");
    if (orderId && orderId.value) orderId.dispatchEvent(new Event("change"));
});
