const products = {
    "stoneware-vase": { name: "Everyday Stoneware Vase", price: 48, detail: "Oat · Hand-finished" },
    "linen-throw": { name: "Washed Linen Throw", price: 96, detail: "Natural · 100% linen" },
    "morning-cups": { name: "Morning Cup Set", price: 38, detail: "Chalk · Set of 2" },
    "oak-board": { name: "Little Oak Serving Board", price: 54, detail: "Solid oak · Small batch" }
};
const cartStorageKey = "forma-cart";
const cartCountElements = document.querySelectorAll("[data-cart-count]");
const cartItemsElement = document.querySelector("[data-cart-items]");
const cartTotalElement = document.querySelector("[data-cart-total]");
const messageElement = document.querySelector("[data-store-message]");
let cart = loadCart();
let messageTimeout;

function loadCart() {
    try {
        const savedCart = JSON.parse(localStorage.getItem(cartStorageKey) || "[]");
        if (!Array.isArray(savedCart)) throw new Error("Saved cart must be an array.");
        return savedCart.filter((item) =>
            item &&
            products[item.id] &&
            Number.isInteger(item.quantity) &&
            item.quantity > 0
        );
    } catch (error) {
        console.error("Could not read the saved Forma cart.", error);
        return [];
    }
}

function saveCart() {
    try {
        localStorage.setItem(cartStorageKey, JSON.stringify(cart));
    } catch (error) {
        console.error("Could not save the Forma cart.", error);
        showMessage("Your bag could not be saved on this device.");
    }
}

function formatPrice(price) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
    }).format(price);
}

function renderCart() {
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountElements.forEach((element) => {
        element.textContent = element.closest(".cart-header") ? `(${itemCount})` : itemCount;
    });

    const subtotal = cart.reduce((sum, item) => sum + products[item.id].price * item.quantity, 0);
    cartTotalElement.textContent = formatPrice(subtotal);

    if (cart.length === 0) {
        cartItemsElement.innerHTML = '<p class="empty-cart">Your bag is taking a little breather.<br />Find something lovely in the <a class="text-link" href="index.html#shop">shop</a>.</p>';
        return;
    }

    cartItemsElement.replaceChildren(...cart.map((item) => {
        const product = products[item.id];
        const article = document.createElement("article");
        article.className = "cart-item";

        const details = document.createElement("div");
        const title = document.createElement("h3");
        title.textContent = product.name;
        const description = document.createElement("p");
        description.textContent = product.detail;
        const quantity = document.createElement("div");
        quantity.className = "quantity-control";
        quantity.innerHTML = `<button type="button" data-quantity-change="-1" data-product-id="${item.id}" aria-label="Decrease ${product.name} quantity">−</button><span>${item.quantity}</span><button type="button" data-quantity-change="1" data-product-id="${item.id}" aria-label="Increase ${product.name} quantity">+</button>`;
        details.append(title, description, quantity);

        const price = document.createElement("span");
        price.className = "cart-item-price";
        price.textContent = formatPrice(product.price * item.quantity);
        const remove = document.createElement("button");
        remove.className = "remove-item";
        remove.type = "button";
        remove.dataset.removeProduct = item.id;
        remove.textContent = "Remove";
        article.append(details, price, remove);
        return article;
    }));
}

function showMessage(message) {
    messageElement.textContent = message;
    messageElement.classList.add("visible");
    window.clearTimeout(messageTimeout);
    messageTimeout = window.setTimeout(() => messageElement.classList.remove("visible"), 2600);
}

function setCartOpen(isOpen) {
    document.body.classList.toggle("cart-open", isOpen);
    document.querySelector(".cart-panel").setAttribute("aria-hidden", String(!isOpen));
}

document.querySelectorAll("[data-cart-open]").forEach((button) => {
    button.addEventListener("click", () => setCartOpen(true));
});
document.querySelectorAll("[data-cart-close]").forEach((element) => {
    element.addEventListener("click", () => setCartOpen(false));
});

document.querySelectorAll("[data-add-to-cart]").forEach((button) => {
    button.addEventListener("click", () => {
        const productId = button.dataset.addToCart;
        const existingItem = cart.find((item) => item.id === productId);
        if (!products[productId]) return;
        if (existingItem) existingItem.quantity += 1;
        else cart.push({ id: productId, quantity: 1 });
        saveCart();
        renderCart();
        showMessage(`${products[productId].name} added to your bag.`);
    });
});

cartItemsElement.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    if (button.dataset.quantityChange) {
        const item = cart.find((entry) => entry.id === button.dataset.productId);
        if (!item) return;
        item.quantity += Number(button.dataset.quantityChange);
        if (item.quantity < 1) cart = cart.filter((entry) => entry !== item);
    } else if (button.dataset.removeProduct) {
        cart = cart.filter((item) => item.id !== button.dataset.removeProduct);
    } else {
        return;
    }

    saveCart();
    renderCart();
});

document.querySelector("[data-checkout]").addEventListener("click", () => {
    if (cart.length === 0) {
        showMessage("Your bag is empty. Find something lovely in the shop.");
        return;
    }
    showMessage("Thanks for shopping Forma! Checkout is a demo and no payment was taken.");
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setCartOpen(false);
});

renderCart();
