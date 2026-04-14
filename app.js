/**
 * Damon's Glizzy's — Order Calculator
 * Menu data & interactive logic
 */

// ============================================
// Menu Data — extracted from menu image
// ============================================
const MENU_ITEMS = {
    food: [
        {
            id: 'frozen-frank',
            name: 'Frozen Frank',
            price: 750,
            emoji: '🍡',
            description: 'Frozen hot dog on a stick'
        },
        {
            id: 'dessert-disaster',
            name: 'Dessert Disaster',
            price: 600,
            emoji: '🌭',
            description: 'Hot dog with sprinkles'
        },
        {
            id: 'cheesequake',
            name: 'Cheesequake',
            price: 500,
            emoji: '🧀',
            description: 'Cheese-smothered hot dog'
        },
        {
            id: 'corn-dog-soup',
            name: 'Corn Dog Soup',
            price: 500,
            emoji: '🍵',
            description: 'Corn dog in a cup of soup'
        }
    ],
    drinks: [
        {
            id: 'frank-shake',
            name: 'Frank Shake',
            price: 750,
            emoji: '🥤',
            description: 'Hot dog milkshake'
        },
        {
            id: 'mustard-slush',
            name: 'Mustard Slush',
            price: 600,
            emoji: '🧃',
            description: 'Mustard-flavored slush'
        },
        {
            id: 'relish-refresher',
            name: 'Relish Refresher',
            price: 500,
            emoji: '🍹',
            description: 'Green relish refresher'
        },
        {
            id: 'electro-glizzy-slush',
            name: 'Electro Glizzy Slush',
            price: 500,
            emoji: '🧊',
            description: 'Blue electric slush with a frank'
        },
        {
            id: 'flamingo-fizzle',
            name: 'Flamingo Fizzle',
            price: 500,
            emoji: '🍧',
            description: 'Pink fizzy drink'
        }
    ]
};

// ============================================
// State
// ============================================
const orderState = {};

// Initialize state for all items
[...MENU_ITEMS.food, ...MENU_ITEMS.drinks].forEach(item => {
    orderState[item.id] = 0;
});

// ============================================
// DOM Rendering
// ============================================

function formatPrice(cents) {
    return '$' + cents.toLocaleString();
}

function createMenuCard(item) {
    const card = document.createElement('div');
    card.className = 'menu-card';
    card.id = `card-${item.id}`;
    card.dataset.itemId = item.id;

    card.innerHTML = `
        <div class="card-top">
            <div class="card-info">
                <div class="card-name">${item.name}</div>
                <div class="card-price">${formatPrice(item.price)}</div>
            </div>
            <div class="card-emoji">${item.emoji}</div>
        </div>
        <div class="quantity-controls">
            <button class="qty-btn minus" data-action="decrement" data-item="${item.id}" title="Remove one">−</button>
            <div class="qty-display" id="qty-${item.id}">0</div>
            <button class="qty-btn plus" data-action="increment" data-item="${item.id}" title="Add one">+</button>
        </div>
        <div class="card-subtotal" id="subtotal-${item.id}">
            Subtotal: <span>$0</span>
        </div>
    `;

    // Ripple effect on card click
    card.addEventListener('click', (e) => {
        // Don't trigger ripple on button clicks
        if (e.target.closest('.qty-btn')) return;
        createRipple(e, card);
    });

    // Button handlers
    card.querySelector('.minus').addEventListener('click', (e) => {
        e.stopPropagation();
        updateQuantity(item.id, -1);
    });

    card.querySelector('.plus').addEventListener('click', (e) => {
        e.stopPropagation();
        updateQuantity(item.id, 1);
    });

    return card;
}

function renderMenuItems() {
    const foodGrid = document.getElementById('food-grid');
    const drinksGrid = document.getElementById('drinks-grid');

    MENU_ITEMS.food.forEach((item, index) => {
        const card = createMenuCard(item);
        card.style.animationDelay = `${index * 0.05 + 0.1}s`;
        card.style.animation = `section-fade-in 0.4s ease-out both`;
        card.style.animationDelay = `${index * 0.06 + 0.15}s`;
        foodGrid.appendChild(card);
    });

    MENU_ITEMS.drinks.forEach((item, index) => {
        const card = createMenuCard(item);
        card.style.animation = `section-fade-in 0.4s ease-out both`;
        card.style.animationDelay = `${index * 0.06 + 0.35}s`;
        drinksGrid.appendChild(card);
    });
}

// ============================================
// Interactions
// ============================================

function updateQuantity(itemId, delta) {
    const newQty = Math.max(0, orderState[itemId] + delta);
    orderState[itemId] = newQty;

    // Update display
    const qtyDisplay = document.getElementById(`qty-${itemId}`);
    qtyDisplay.textContent = newQty;
    
    // Toggle active state on display
    if (newQty > 0) {
        qtyDisplay.classList.add('has-value');
    } else {
        qtyDisplay.classList.remove('has-value');
    }

    // Pop animation
    qtyDisplay.classList.remove('pop');
    void qtyDisplay.offsetWidth; // force reflow
    qtyDisplay.classList.add('pop');

    // Update card active state
    const card = document.getElementById(`card-${itemId}`);
    if (newQty > 0) {
        card.classList.add('active');
        // Pulse on increment
        if (delta > 0) {
            card.classList.remove('pulse');
            void card.offsetWidth;
            card.classList.add('pulse');
        }
    } else {
        card.classList.remove('active');
    }

    // Update subtotal
    const item = getAllItems().find(i => i.id === itemId);
    const subtotalEl = document.getElementById(`subtotal-${itemId}`);
    if (newQty > 0) {
        subtotalEl.classList.add('visible');
        subtotalEl.querySelector('span').textContent = formatPrice(item.price * newQty);
    } else {
        subtotalEl.classList.remove('visible');
    }

    // Update footer
    updateOrderFooter();
}

function updateOrderFooter() {
    const allItems = getAllItems();
    let totalItems = 0;
    let totalAmount = 0;
    const activeItems = [];

    allItems.forEach(item => {
        const qty = orderState[item.id];
        if (qty > 0) {
            totalItems += qty;
            totalAmount += item.price * qty;
            activeItems.push({ ...item, qty });
        }
    });

    // Update totals
    document.getElementById('total-items').textContent = totalItems;
    document.getElementById('total-amount').textContent = formatPrice(totalAmount);

    // Show/hide footer
    const footer = document.getElementById('order-footer');
    if (totalItems > 0) {
        footer.classList.add('visible');
    } else {
        footer.classList.remove('visible');
    }

    // Breakdown chips
    const breakdownEl = document.getElementById('order-breakdown');
    breakdownEl.innerHTML = '';
    
    if (activeItems.length > 0) {
        breakdownEl.classList.add('has-items');
        activeItems.forEach((item, i) => {
            const chip = document.createElement('div');
            chip.className = 'breakdown-chip';
            chip.style.animationDelay = `${i * 0.03}s`;
            chip.innerHTML = `
                <span class="chip-qty">${item.qty}×</span>
                <span class="chip-name">${item.name}</span>
            `;
            breakdownEl.appendChild(chip);
        });
    } else {
        breakdownEl.classList.remove('has-items');
    }
}

function clearAll() {
    const allItems = getAllItems();
    allItems.forEach(item => {
        orderState[item.id] = 0;
        
        const qtyDisplay = document.getElementById(`qty-${item.id}`);
        qtyDisplay.textContent = '0';
        qtyDisplay.classList.remove('has-value');
        
        const card = document.getElementById(`card-${item.id}`);
        card.classList.remove('active', 'pulse');
        
        const subtotalEl = document.getElementById(`subtotal-${item.id}`);
        subtotalEl.classList.remove('visible');
    });

    updateOrderFooter();
}

// ============================================
// Helpers
// ============================================

function getAllItems() {
    return [...MENU_ITEMS.food, ...MENU_ITEMS.drinks];
}

function createRipple(event, element) {
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    element.appendChild(ripple);
    
    ripple.addEventListener('animationend', () => {
        ripple.remove();
    });
}

// ============================================
// Keyboard shortcuts
// ============================================

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        clearAll();
    }
});

// ============================================
// Init
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    renderMenuItems();
    
    // Clear all button
    document.getElementById('clear-all-btn').addEventListener('click', clearAll);
});
