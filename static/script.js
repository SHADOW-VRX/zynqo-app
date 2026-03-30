/**
 * ZYNQO - Premium Checkout-Free Shopping System
 * Frontend Application Logic with Smooth Animations
 */

// ============================================
// GLOBAL VARIABLES
// ============================================

let cart = {};
let html5QrCode = null;
let isScannerActive = false;
let currentOrder = null;
let allOrders = [];
let allProducts = [];
let categories = new Set();
let audioContext = null;
let debounceTimer = null;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    initializeScanner();
    loadCartFromStorage();
    updateCartUI();
    attachEventListeners();
    loadOrderHistory();
    loadAllProducts();
    initAudio();
    setupCloseButtons();
});

function initializeApp() {
    console.log('Zynqo Premium App Initialized');
    showToast('Welcome to Zynqo!', 'success');
}

function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.log('Web Audio API not supported');
    }
}

function setupCloseButtons() {
    // Close history modal button
    const closeHistoryBtn = document.getElementById('closeHistoryModalBtn');
    if (closeHistoryBtn) {
        closeHistoryBtn.addEventListener('click', closeHistoryModal);
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        const historyModal = document.getElementById('historyModal');
        if (e.target === historyModal) {
            closeHistoryModal();
        }
        const receiptModal = document.getElementById('receiptModal');
        if (e.target === receiptModal) {
            closeReceiptModal();
        }
        const categoryModal = document.getElementById('categoryModal');
        if (e.target === categoryModal) {
            closeCategoryModal();
        }
    });
}

// ============================================
// PRODUCT & CATEGORY MANAGEMENT
// ============================================

async function loadAllProducts() {
    try {
        const response = await fetch('/api/owner/products');
        const data = await response.json();
        if (data.success) {
            allProducts = data.products;
            categories.clear();
            allProducts.forEach(product => {
                if (product.category) {
                    categories.add(product.category);
                }
            });
            renderCategories();
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function renderCategories() {
    const categoriesList = document.getElementById('categoriesList');
    if (!categoriesList) return;
    
    const sortedCategories = Array.from(categories).sort();
    
    if (sortedCategories.length === 0) {
        categoriesList.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">No categories available</div>';
        return;
    }
    
    categoriesList.innerHTML = sortedCategories.map(category => `
        <div class="category-item" onclick="showCategoryProducts('${category.replace(/'/g, "\\'")}')">
            <i class="fas fa-folder"></i>
            <span>${escapeHtml(category)}</span>
        </div>
    `).join('');
}

async function showCategoryProducts(category) {
    showLoading(true);
    try {
        const response = await fetch('/api/owner/products');
        const data = await response.json();
        if (data.success) {
            const categoryProducts = data.products.filter(p => p.category === category);
            displayCategoryProducts(category, categoryProducts);
            closeSidebar();
        }
    } catch (error) {
        console.error('Error loading category products:', error);
        showToast('Error loading products', 'error');
    } finally {
        showLoading(false);
    }
}

function displayCategoryProducts(category, products) {
    const modal = document.getElementById('categoryModal');
    const categoryName = document.getElementById('selectedCategoryName');
    const productsList = document.getElementById('categoryProductsList');
    
    categoryName.textContent = category;
    
    if (products.length === 0) {
        productsList.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">No products in this category</div>';
    } else {
        productsList.innerHTML = products.map(product => `
            <div class="product-card">
                <div class="product-card-icon">${product.image || '📦'}</div>
                <div class="product-card-name">${escapeHtml(product.name)}</div>
                <div class="product-card-price">₹${product.price.toFixed(2)}</div>
                <div class="product-card-code">Code: ${product.code}</div>
                <button class="add-to-cart-btn" onclick="addProductToCartFromCategory('${product.id}', '${product.name.replace(/'/g, "\\'")}', ${product.price}, '${product.code}', '${product.image || '📦'}')">
                    <i class="fas fa-cart-plus"></i> Add to Cart
                </button>
            </div>
        `).join('');
    }
    
    modal.classList.add('show');
}

function closeCategoryModal() {
    document.getElementById('categoryModal').classList.remove('show');
}

function addProductToCartFromCategory(id, name, price, code, image) {
    const product = { id, name, price, code, image };
    addToCart(product);
    closeCategoryModal();
    showToast(`${name} added to cart!`, 'success');
}

// ============================================
// CART MANAGEMENT
// ============================================

function addToCart(product) {
    const productId = product.id;
    
    if (cart[productId]) {
        cart[productId].quantity += 1;
        showToast(`${product.name} quantity increased to ${cart[productId].quantity}`, 'success');
        playScanSound();
        highlightCartItem(productId);
    } else {
        cart[productId] = {
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            code: product.code,
            image: product.image || '📦'
        };
        showToast(`${product.name} added to cart`, 'success');
        playScanSound();
        animateAddToCart();
    }
    
    saveCartToStorage();
    updateCartUI();
}

function animateAddToCart() {
    const cartIcon = document.querySelector('.cart-count');
    if (cartIcon) {
        cartIcon.style.transform = 'scale(1.2)';
        setTimeout(() => {
            cartIcon.style.transform = 'scale(1)';
        }, 300);
    }
}

function increaseQuantity(productId) {
    if (cart[productId]) {
        cart[productId].quantity += 1;
        saveCartToStorage();
        updateCartUI();
        animateQuantityChange(productId);
    }
}

function decreaseQuantity(productId) {
    if (cart[productId]) {
        if (cart[productId].quantity > 1) {
            cart[productId].quantity -= 1;
            saveCartToStorage();
            updateCartUI();
            animateQuantityChange(productId);
        } else if (cart[productId].quantity === 1) {
            removeItem(productId);
        }
    }
}

function animateQuantityChange(productId) {
    const itemElement = document.getElementById(`cart-item-${productId}`);
    if (itemElement) {
        itemElement.classList.add('highlight');
        setTimeout(() => {
            itemElement.classList.remove('highlight');
        }, 500);
    }
}

function removeItem(productId) {
    if (cart[productId]) {
        const productName = cart[productId].name;
        delete cart[productId];
        saveCartToStorage();
        updateCartUI();
        showToast(`${productName} removed from cart`, 'warning');
    }
}

function updateQuantityFromInput(productId, newQuantity) {
    if (cart[productId]) {
        let quantity = parseInt(newQuantity);
        if (isNaN(quantity)) quantity = 1;
        if (quantity <= 0) {
            removeItem(productId);
        } else {
            cart[productId].quantity = quantity;
            saveCartToStorage();
            updateCartUI();
        }
    }
}

function updateCartUI() {
    const cartContainer = document.getElementById('cart-items-container');
    const cartCount = document.getElementById('cartCount');
    const itemsCount = Object.keys(cart).length;
    
    cartCount.textContent = itemsCount;
    
    if (itemsCount === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">
                    <i class="fas fa-shopping-basket"></i>
                </div>
                <h3>Your cart is empty</h3>
                <p>Scan items or browse categories to start shopping</p>
            </div>
        `;
        updateTotals(0);
        return;
    }
    
    let cartHTML = '';
    let subtotal = 0;
    
    for (const [productId, item] of Object.entries(cart)) {
        const itemSubtotal = item.price * item.quantity;
        subtotal += itemSubtotal;
        
        cartHTML += `
            <div class="cart-item" id="cart-item-${productId}">
                <div class="item-info">
                    <div>
                        <span class="item-name">${escapeHtml(item.name)}</span>
                        <span style="margin-left: 8px;">${item.image || '📦'}</span>
                    </div>
                    <div class="item-price">₹${item.price.toFixed(2)}</div>
                </div>
                <div class="item-controls">
                    <div class="quantity-controls">
                        <button class="qty-btn" onclick="decreaseQuantity('${productId}')">−</button>
                        <input type="number" class="quantity-input" 
                               value="${item.quantity}" 
                               min="1"
                               onchange="updateQuantityFromInput('${productId}', this.value)">
                        <button class="qty-btn" onclick="increaseQuantity('${productId}')">+</button>
                    </div>
                    <div class="item-subtotal">Subtotal: ₹${itemSubtotal.toFixed(2)}</div>
                    <button class="remove-item" onclick="removeItem('${productId}')">
                        <i class="fas fa-trash-alt"></i> Remove
                    </button>
                </div>
            </div>
        `;
    }
    
    cartContainer.innerHTML = cartHTML;
    updateTotals(subtotal);
}

function updateTotals(subtotal) {
    const tax = subtotal * 0.05;
    const total = subtotal + tax;
    
    document.getElementById('subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('tax').textContent = `₹${tax.toFixed(2)}`;
    document.getElementById('total').textContent = `₹${total.toFixed(2)}`;
}

function highlightCartItem(productId) {
    const itemElement = document.getElementById(`cart-item-${productId}`);
    if (itemElement) {
        itemElement.classList.add('highlight');
        setTimeout(() => {
            itemElement.classList.remove('highlight');
        }, 500);
    }
}

// ============================================
// SCANNER FUNCTIONALITY
// ============================================

function initializeScanner() {
    html5QrCode = new Html5Qrcode("qr-reader");
}

async function startScanner() {
    if (isScannerActive) return;
    
    try {
        showLoading(true);
        await html5QrCode.start(
            { facingMode: "environment" },
            {
                fps: 10,
                qrbox: { width: 250, height: 250 }
            },
            onScanSuccess,
            onScanError
        );
        isScannerActive = true;
        showLoading(false);
        showToast('Scanner started! Point camera at barcode', 'success');
    } catch (err) {
        showLoading(false);
        console.error('Error starting scanner:', err);
        showToast('Unable to start camera. Please check permissions.', 'error');
    }
}

function stopScanner() {
    if (html5QrCode && isScannerActive) {
        html5QrCode.stop().then(() => {
            isScannerActive = false;
            showToast('Scanner stopped', 'info');
        }).catch(err => {
            console.error('Error stopping scanner:', err);
        });
    }
}

function toggleScanner() {
    const scannerContainer = document.getElementById('scanner-container');
    if (scannerContainer.style.display === 'none') {
        scannerContainer.style.display = 'block';
        startScanner();
    } else {
        scannerContainer.style.display = 'none';
        stopScanner();
    }
}

async function onScanSuccess(decodedText, decodedResult) {
    console.log(`Scanned: ${decodedText}`);
    await addProductByCode(decodedText);
    animateScanSuccess();
}

function animateScanSuccess() {
    const scannerWrapper = document.querySelector('.scanner-preview-wrapper');
    if (scannerWrapper) {
        scannerWrapper.style.boxShadow = '0 0 0 3px var(--success)';
        setTimeout(() => {
            scannerWrapper.style.boxShadow = 'none';
        }, 500);
    }
}

function onScanError(errorMessage) {
    // Silently handle scan errors
}

// ============================================
// PRODUCT FETCHING
// ============================================

async function addProductByCode(code) {
    showLoading(true);
    
    try {
        const response = await fetch(`/api/get-product/${encodeURIComponent(code)}`);
        const data = await response.json();
        
        if (data.success) {
            addToCart(data.product);
        } else {
            showToast(data.message || 'Product not found!', 'error');
        }
    } catch (error) {
        console.error('Error fetching product:', error);
        showToast('Network error. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

async function addManualProduct() {
    const codeInput = document.getElementById('manualCode');
    const code = codeInput.value.trim();
    
    if (!code) {
        showToast('Please enter a product code', 'warning');
        return;
    }
    
    await addProductByCode(code);
    codeInput.value = '';
}

// ============================================
// PAYMENT & ORDER PROCESSING
// ============================================

async function processPayment() {
    const cartItems = Object.values(cart);
    
    if (cartItems.length === 0) {
        showToast('Cart is empty! Please add items before payment.', 'warning');
        return;
    }
    
    const orderData = {
        cart: cartItems.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        }))
    };
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentOrder = data.order;
            await loadOrderHistory();
            showReceiptModal(currentOrder);
            clearCart();
            showToast('Payment successful! Thank you for shopping!', 'success');
        } else {
            showToast(data.message || 'Payment failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        showToast('Network error. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

function showReceiptModal(order) {
    const receiptContent = document.getElementById('receiptContent');
    
    const subtotal = order.total / 1.05;
    const tax = order.total - subtotal;
    
    const receiptHTML = `
        <div class="receipt-header">
            <h3>ZYNQO</h3>
            <p>Checkout-Free Shopping</p>
            <p><strong>Order ID:</strong> ${escapeHtml(order.order_id)}</p>
            <p><strong>Date:</strong> ${escapeHtml(order.date)}</p>
        </div>
        <div class="receipt-items">
            <h4>Items Purchased:</h4>
            ${order.items.map(item => `
                <div class="receipt-item">
                    <span>${escapeHtml(item.name)} x ${item.quantity}</span>
                    <span>₹${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            `).join('')}
        </div>
        <div class="receipt-total">
            <span>Total Amount:</span>
            <span>₹${order.total.toFixed(2)}</span>
        </div>
        <div style="text-align: center; margin-top: 20px; font-size: 0.85rem; color: #666;">
            <p>Thank you for shopping with Zynqo!</p>
        </div>
    `;
    
    receiptContent.innerHTML = receiptHTML;
    document.getElementById('receiptModal').classList.add('show');
}

function closeReceiptModal() {
    document.getElementById('receiptModal').classList.remove('show');
    currentOrder = null;
}

function printReceipt() {
    const receiptContent = document.getElementById('receiptContent').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Zynqo Receipt</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .receipt-header { text-align: center; margin-bottom: 20px; }
                    .receipt-items { margin: 20px 0; }
                    .receipt-item { display: flex; justify-content: space-between; padding: 5px 0; }
                    .receipt-total { margin-top: 20px; padding-top: 10px; border-top: 2px solid #000; font-weight: bold; display: flex; justify-content: space-between; }
                </style>
            </head>
            <body>
                ${receiptContent}
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// ============================================
// ORDER HISTORY
// ============================================

async function loadOrderHistory() {
    try {
        const response = await fetch('/api/orders');
        const data = await response.json();
        if (data.success && data.orders) {
            allOrders = data.orders;
        }
    } catch (error) {
        console.error('Error loading order history:', error);
    }
}

async function showOrderHistory() {
    showLoading(true);
    try {
        const response = await fetch('/api/orders');
        const data = await response.json();
        if (data.success && data.orders && data.orders.length > 0) {
            displayOrderHistoryList(data.orders);
        } else {
            displayEmptyHistory();
        }
    } catch (error) {
        displayEmptyHistory();
        showToast('Unable to fetch order history', 'error');
    } finally {
        showLoading(false);
    }
}

function displayOrderHistoryList(orders) {
    const historyContent = document.getElementById('historyContent');
    historyContent.innerHTML = `
        <div class="history-list">
            ${orders.map((order, index) => `
                <div class="history-item" onclick="viewReceiptFromHistory(${index})">
                    <div class="history-order-id">${escapeHtml(order.order_id)}</div>
                    <div class="history-date">${escapeHtml(order.date)}</div>
                    <div class="history-details">
                        <span>${order.item_count} items</span>
                        <span>₹${order.total.toFixed(2)}</span>
                    </div>
                    <button class="view-receipt-btn" onclick="event.stopPropagation(); viewReceiptFromHistory(${index})">View Receipt</button>
                </div>
            `).join('')}
        </div>
    `;
    document.getElementById('historyModal').classList.add('show');
}

function displayEmptyHistory() {
    const historyContent = document.getElementById('historyContent');
    historyContent.innerHTML = `
        <div class="empty-history" style="text-align: center; padding: 40px;">
            <i class="fas fa-receipt" style="font-size: 3rem; color: #ccc;"></i>
            <p>No order history found</p>
            <p style="font-size: 0.85rem; margin-top: 10px;">Complete a purchase to see your receipts here!</p>
        </div>
    `;
    document.getElementById('historyModal').classList.add('show');
}

function viewReceiptFromHistory(orderIndex) {
    if (allOrders && allOrders[orderIndex]) {
        showReceiptModal(allOrders[orderIndex]);
        closeHistoryModal();
    }
}

function closeHistoryModal() {
    document.getElementById('historyModal').classList.remove('show');
}

// ============================================
// SIDEBAR FUNCTIONS
// ============================================

function openSidebar() {
    document.getElementById('categoriesSidebar').classList.add('open');
    document.getElementById('sidebarOverlay').classList.add('show');
}

function closeSidebar() {
    document.getElementById('categoriesSidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('show');
}

// ============================================
// CART UTILITIES
// ============================================

function clearCart() {
    if (Object.keys(cart).length === 0) {
        showToast('Cart is already empty', 'info');
        return;
    }
    
    if (confirm('Are you sure you want to clear your entire cart?')) {
        cart = {};
        saveCartToStorage();
        updateCartUI();
        showToast('Cart cleared successfully', 'success');
    }
}

function saveCartToStorage() {
    localStorage.setItem('zynqo_cart', JSON.stringify(cart));
}

function loadCartFromStorage() {
    const savedCart = localStorage.getItem('zynqo_cart');
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
        } catch (e) {
            cart = {};
        }
    }
}

// ============================================
// UI UTILITIES
// ============================================

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.add('show');
    } else {
        overlay.classList.remove('show');
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function playScanSound() {
    if (!audioContext) return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 880;
        gainNode.gain.value = 0.1;
        
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.3);
        oscillator.stop(audioContext.currentTime + 0.3);
        
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
    } catch (e) {
        console.log('Could not play sound:', e);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// EVENT LISTENERS
// ============================================

function attachEventListeners() {
    document.getElementById('startScannerBtn').addEventListener('click', startScanner);
    document.getElementById('stopScannerBtn').addEventListener('click', stopScanner);
    document.getElementById('manualAddBtn').addEventListener('click', addManualProduct);
    document.getElementById('manualCode').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addManualProduct();
    });
    
    document.getElementById('checkoutBtn').addEventListener('click', processPayment);
    document.getElementById('clearCartBtn').addEventListener('click', clearCart);
    document.getElementById('historyBtn').addEventListener('click', showOrderHistory);
    
    document.getElementById('menuBtn').addEventListener('click', openSidebar);
    document.getElementById('closeSidebarBtn').addEventListener('click', closeSidebar);
    document.getElementById('sidebarOverlay').addEventListener('click', closeSidebar);
    
    // Button click animations
    document.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            btn.style.transform = 'scale(0.98)';
            setTimeout(() => {
                btn.style.transform = '';
            }, 200);
        });
    });
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        startScanner();
    }
    if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        clearCart();
    }
    if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        processPayment();
    }
    if (e.key === 'Escape') {
        closeReceiptModal();
        closeHistoryModal();
        closeSidebar();
        closeCategoryModal();
    }
});

// ============================================
// AUTO REFRESH PRODUCTS
// ============================================

setInterval(() => {
    loadAllProducts();
}, 30000);

// ============================================
// EXPOSE FUNCTIONS TO GLOBAL SCOPE
// ============================================

window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;
window.removeItem = removeItem;
window.updateQuantityFromInput = updateQuantityFromInput;
window.closeReceiptModal = closeReceiptModal;
window.closeHistoryModal = closeHistoryModal;
window.printReceipt = printReceipt;
window.viewReceiptFromHistory = viewReceiptFromHistory;
window.showCategoryProducts = showCategoryProducts;
window.addProductToCartFromCategory = addProductToCartFromCategory;
window.closeCategoryModal = closeCategoryModal;
window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;

console.log('Zynqo Premium App Ready!');