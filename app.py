"""
Zynqo - Checkout-Free Shopping System
Backend Flask Application with Owner Dashboard
Production Ready for Render Deployment
"""

import os
import json
import uuid
from datetime import datetime
from flask import Flask, jsonify, request, render_template, send_from_directory, session, redirect, url_for
from flask_cors import CORS
from functools import wraps

app = Flask(__name__, static_folder='static', template_folder='templates')
app.secret_key = os.environ.get('SECRET_KEY', 'zynqo_secret_key_2024_secure')
CORS(app)

# File paths
PRODUCTS_FILE = 'products.json'
ORDERS_FILE = 'orders.json'

# Owner credentials (in production, use environment variables)
OWNER_CREDENTIALS = {
    'username': os.environ.get('OWNER_USERNAME', 'admin'),
    'password': os.environ.get('OWNER_PASSWORD', 'admin123')
}

def login_required(f):
    """Decorator to require login for dashboard routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('logged_in'):
            return redirect(url_for('owner_login'))
        return f(*args, **kwargs)
    return decorated_function

def load_products():
    """Load products from JSON file"""
    try:
        if os.path.exists(PRODUCTS_FILE):
            with open(PRODUCTS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            # Create default products if file doesn't exist
            default_products = [
                {
                    "id": "PROD001",
                    "name": "Organic Fresh Milk",
                    "price": 65,
                    "code": "8901234567890",
                    "category": "Dairy",
                    "image": "🥛",
                    "description": "Fresh organic milk from grass-fed cows",
                    "stock": 100
                },
                {
                    "id": "PROD002",
                    "name": "Whole Wheat Bread",
                    "price": 45,
                    "code": "8901234567891",
                    "category": "Bakery",
                    "image": "🍞",
                    "description": "Freshly baked whole wheat bread",
                    "stock": 50
                },
                {
                    "id": "PROD003",
                    "name": "Farm Fresh Eggs",
                    "price": 55,
                    "code": "8901234567892",
                    "category": "Dairy",
                    "image": "🥚",
                    "description": "Pack of 6 farm-fresh eggs",
                    "stock": 200
                },
                {
                    "id": "PROD004",
                    "name": "Basmati Rice",
                    "price": 120,
                    "code": "8901234567893",
                    "category": "Grains",
                    "image": "🍚",
                    "description": "Premium aged basmati rice (1kg)",
                    "stock": 75
                },
                {
                    "id": "PROD005",
                    "name": "Premium Olive Oil",
                    "price": 450,
                    "code": "8901234567894",
                    "category": "Cooking",
                    "image": "🫒",
                    "description": "Extra virgin olive oil (500ml)",
                    "stock": 30
                },
                {
                    "id": "PROD006",
                    "name": "Fresh Apples",
                    "price": 80,
                    "code": "8901234567895",
                    "category": "Fruits",
                    "image": "🍎",
                    "description": "Crisp and juicy red apples (4 pcs)",
                    "stock": 120
                },
                {
                    "id": "PROD007",
                    "name": "Potato Chips",
                    "price": 30,
                    "code": "8901234567896",
                    "category": "Snacks",
                    "image": "🥔",
                    "description": "Classic salted potato chips",
                    "stock": 300
                },
                {
                    "id": "PROD008",
                    "name": "Coca-Cola",
                    "price": 40,
                    "code": "8901234567897",
                    "category": "Beverages",
                    "image": "🥤",
                    "description": "Refreshing cola drink (500ml)",
                    "stock": 150
                },
                {
                    "id": "PROD009",
                    "name": "Toothpaste",
                    "price": 85,
                    "code": "8901234567898",
                    "category": "Personal Care",
                    "image": "🪥",
                    "description": "Cavity protection toothpaste (100g)",
                    "stock": 80
                },
                {
                    "id": "PROD010",
                    "name": "Hand Sanitizer",
                    "price": 95,
                    "code": "8901234567899",
                    "category": "Health",
                    "image": "🧴",
                    "description": "Alcohol-based hand sanitizer (100ml)",
                    "stock": 60
                },
                {
                    "id": "PROD011",
                    "name": "Notebook",
                    "price": 35,
                    "code": "8901234567800",
                    "category": "Stationery",
                    "image": "📓",
                    "description": "100-page ruled notebook",
                    "stock": 200
                },
                {
                    "id": "PROD012",
                    "name": "Pen Pack",
                    "price": 50,
                    "code": "8901234567801",
                    "category": "Stationery",
                    "image": "✒️",
                    "description": "Pack of 5 ballpoint pens",
                    "stock": 250
                },
                {
                    "id": "PROD013",
                    "name": "Face Mask Pack",
                    "price": 150,
                    "code": "8901234567802",
                    "category": "Health",
                    "image": "😷",
                    "description": "Disposable face masks (pack of 10)",
                    "stock": 100
                },
                {
                    "id": "PROD014",
                    "name": "Butter Chicken Paste",
                    "price": 110,
                    "code": "8901234567803",
                    "category": "Cooking",
                    "image": "🍛",
                    "description": "Authentic butter chicken curry paste",
                    "stock": 45
                },
                {
                    "id": "PROD015",
                    "name": "Greek Yogurt",
                    "price": 75,
                    "code": "8901234567804",
                    "category": "Dairy",
                    "image": "🥣",
                    "description": "Strained Greek yogurt (400g)",
                    "stock": 90
                }
            ]
            
            with open(PRODUCTS_FILE, 'w', encoding='utf-8') as f:
                json.dump(default_products, f, indent=2, ensure_ascii=False)
            
            return default_products
    except Exception as e:
        print(f"Error loading products: {e}")
        return []

def save_products(products):
    """Save products to JSON file"""
    try:
        with open(PRODUCTS_FILE, 'w', encoding='utf-8') as f:
            json.dump(products, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving products: {e}")
        return False

def load_orders():
    """Load orders from JSON file"""
    try:
        if os.path.exists(ORDERS_FILE):
            with open(ORDERS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data if data else []
        else:
            # Create empty orders file
            with open(ORDERS_FILE, 'w', encoding='utf-8') as f:
                json.dump([], f, indent=2, ensure_ascii=False)
            return []
    except (json.JSONDecodeError, FileNotFoundError):
        # If file is corrupted or empty, create new one
        with open(ORDERS_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f, indent=2, ensure_ascii=False)
        return []

def save_order(order_data):
    """Save order to JSON file"""
    try:
        orders = load_orders()
        orders.insert(0, order_data)  # Add new order at the beginning
        with open(ORDERS_FILE, 'w', encoding='utf-8') as f:
            json.dump(orders, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving order: {e}")
        return False

# ============================================
# MAIN ROUTES
# ============================================

@app.route('/')
def index():
    """Serve the main page"""
    return render_template('index.html')

@app.route('/owner-login')
def owner_login():
    """Owner login page"""
    return render_template('owner_login.html')

@app.route('/api/owner/auth', methods=['POST'])
def authenticate_owner():
    """Authenticate owner"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if username == OWNER_CREDENTIALS['username'] and password == OWNER_CREDENTIALS['password']:
        session['logged_in'] = True
        return jsonify({'success': True, 'redirect': '/owner-dashboard'})
    else:
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@app.route('/owner-dashboard')
@login_required
def owner_dashboard():
    """Owner dashboard page"""
    return render_template('owner_dashboard.html')

@app.route('/api/owner/logout', methods=['POST'])
def owner_logout():
    """Logout owner"""
    session.pop('logged_in', None)
    return jsonify({'success': True})

# ============================================
# PRODUCT MANAGEMENT APIs
# ============================================

@app.route('/api/owner/products', methods=['GET'])
@login_required
def get_all_products_admin():
    """Get all products for admin"""
    products = load_products()
    return jsonify({
        'success': True,
        'products': products,
        'count': len(products)
    })

@app.route('/api/owner/products', methods=['POST'])
@login_required
def add_product():
    """Add new product"""
    try:
        data = request.get_json()
        products = load_products()
        
        # Generate new ID
        new_id = f"PROD{str(len(products) + 1).zfill(3)}"
        
        new_product = {
            'id': new_id,
            'name': data.get('name'),
            'price': float(data.get('price')),
            'code': data.get('code'),
            'category': data.get('category', 'General'),
            'image': data.get('image', '📦'),
            'description': data.get('description', ''),
            'stock': int(data.get('stock', 0))
        }
        
        products.append(new_product)
        if save_products(products):
            return jsonify({'success': True, 'product': new_product})
        else:
            return jsonify({'success': False, 'message': 'Failed to save product'}), 500
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/owner/products/<product_id>', methods=['PUT'])
@login_required
def update_product(product_id):
    """Update existing product"""
    try:
        data = request.get_json()
        products = load_products()
        
        for i, product in enumerate(products):
            if product['id'] == product_id:
                products[i] = {
                    'id': product_id,
                    'name': data.get('name', product['name']),
                    'price': float(data.get('price', product['price'])),
                    'code': data.get('code', product['code']),
                    'category': data.get('category', product.get('category', 'General')),
                    'image': data.get('image', product.get('image', '📦')),
                    'description': data.get('description', product.get('description', '')),
                    'stock': int(data.get('stock', product.get('stock', 0)))
                }
                if save_products(products):
                    return jsonify({'success': True, 'product': products[i]})
                else:
                    return jsonify({'success': False, 'message': 'Failed to save product'}), 500
        
        return jsonify({'success': False, 'message': 'Product not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/owner/products/<product_id>', methods=['DELETE'])
@login_required
def delete_product(product_id):
    """Delete product"""
    try:
        products = load_products()
        products = [p for p in products if p['id'] != product_id]
        if save_products(products):
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'message': 'Failed to delete product'}), 500
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ============================================
# ORDER MANAGEMENT APIs
# ============================================

@app.route('/api/owner/orders', methods=['GET'])
@login_required
def get_all_orders():
    """Get all orders for admin"""
    try:
        orders = load_orders()
        total_revenue = sum(order.get('total', 0) for order in orders)
        return jsonify({
            'success': True,
            'orders': orders,
            'count': len(orders),
            'total_revenue': total_revenue
        })
    except Exception as e:
        print(f"Error getting orders: {e}")
        return jsonify({
            'success': True,
            'orders': [],
            'count': 0,
            'total_revenue': 0
        })

@app.route('/api/owner/orders/<order_id>', methods=['DELETE'])
@login_required
def delete_order(order_id):
    """Delete order"""
    try:
        orders = load_orders()
        orders = [o for o in orders if o.get('order_id') != order_id]
        with open(ORDERS_FILE, 'w', encoding='utf-8') as f:
            json.dump(orders, f, indent=2, ensure_ascii=False)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# ============================================
# STATISTICS APIs
# ============================================

@app.route('/api/owner/stats', methods=['GET'])
@login_required
def get_stats():
    """Get dashboard statistics"""
    try:
        products = load_products()
        orders = load_orders()
        
        total_products = len(products)
        total_orders = len(orders)
        total_revenue = sum(order.get('total', 0) for order in orders)
        total_items_sold = sum(order.get('item_count', 0) for order in orders)
        low_stock_products = len([p for p in products if p.get('stock', 0) < 20])
        
        return jsonify({
            'success': True,
            'stats': {
                'total_products': total_products,
                'total_orders': total_orders,
                'total_revenue': total_revenue,
                'total_items_sold': total_items_sold,
                'low_stock_products': low_stock_products
            }
        })
    except Exception as e:
        print(f"Error getting stats: {e}")
        return jsonify({
            'success': True,
            'stats': {
                'total_products': 0,
                'total_orders': 0,
                'total_revenue': 0,
                'total_items_sold': 0,
                'low_stock_products': 0
            }
        })

# ============================================
# PUBLIC APIs (No Auth Required)
# ============================================

@app.route('/api/get-product/<code>', methods=['GET'])
def get_product(code):
    """Get product by barcode/QR code"""
    products = load_products()
    
    # Search for product by code
    product = None
    for p in products:
        if p['code'] == code or p['id'].lower() == code.lower():
            product = p.copy()
            break
    
    if product:
        return jsonify({
            'success': True,
            'product': {
                'id': product['id'],
                'name': product['name'],
                'price': product['price'],
                'code': product['code'],
                'category': product.get('category', 'General'),
                'image': product.get('image', '📦')
            }
        })
    else:
        return jsonify({
            'success': False,
            'message': 'Product not found. Please check the barcode and try again.'
        }), 404

@app.route('/api/create-order', methods=['POST'])
def create_order():
    """Create a new order from cart items"""
    try:
        data = request.get_json()
        cart_items = data.get('cart', [])
        
        if not cart_items:
            return jsonify({
                'success': False,
                'message': 'Cart is empty'
            }), 400
        
        # Calculate total
        total = sum(item['price'] * item['quantity'] for item in cart_items)
        
        # Generate order ID
        order_id = f"ZYNQO-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        # Create order object
        order = {
            'order_id': order_id,
            'timestamp': datetime.now().isoformat(),
            'date': datetime.now().strftime('%B %d, %Y at %I:%M %p'),
            'items': cart_items,
            'total': total,
            'item_count': sum(item['quantity'] for item in cart_items),
            'status': 'completed'
        }
        
        # Save order
        if save_order(order):
            return jsonify({
                'success': True,
                'order': order
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to save order'
            }), 500
        
    except Exception as e:
        print(f"Error creating order: {e}")
        return jsonify({
            'success': False,
            'message': f'Error creating order: {str(e)}'
        }), 500

@app.route('/api/orders', methods=['GET'])
def get_public_orders():
    """Get orders for customer receipt history"""
    try:
        orders = load_orders()
        # Return last 10 orders for customer view
        return jsonify({
            'success': True,
            'orders': orders[:10] if orders else []
        })
    except Exception as e:
        print(f"Error getting public orders: {e}")
        return jsonify({
            'success': True,
            'orders': []
        })

@app.route('/static/<path:filename>')
def serve_static(filename):
    """Serve static files"""
    return send_from_directory('static', filename)

# ============================================
# PRODUCTION READY
# ============================================

# For Vercel/Render deployment
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_PERMANENT'] = False

# Health check endpoint for Render
@app.route('/health')
def health_check():
    """Health check endpoint for Render"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

# ============================================
# RUN THE APPLICATION
# ============================================

if __name__ == '__main__':
    # Initialize files
    load_products()
    load_orders()
    
    # Get port from environment variable (Render sets this)
    port = int(os.environ.get('PORT', 5000))
    
    print("\n" + "="*60)
    print("🛒 ZYNQO - Checkout-Free Shopping System")
    print("="*60)
    print(f"📱 Customer App: Running on port {port}")
    print(f"👑 Owner Dashboard: /owner-login")
    print(f"🔐 Owner Credentials: {OWNER_CREDENTIALS['username']} / {OWNER_CREDENTIALS['password']}")
    print("="*60)
    
    # For production, debug should be False
    app.run(debug=False, host='0.0.0.0', port=port)