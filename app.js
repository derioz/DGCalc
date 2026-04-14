/**
 * Damon's Glizzy's — Order Calculator
 * Menu data & interactive logic with enhanced features
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
let orderNumber = Math.floor(Math.random() * 9000) + 1000;
let soundEnabled = true;
let lastTotal = 0;

// Initialize state for all items
getAllItems().forEach(item => {
    orderState[item.id] = 0;
});

// ============================================
// Sound Effects (Web Audio API)
// ============================================
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new AudioCtx();
    }
    return audioCtx;
}

function playSound(type) {
    if (!soundEnabled) return;

    try {
        const ctx = getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        const now = ctx.currentTime;

        switch (type) {
            case 'add':
                oscillator.frequency.setValueAtTime(600, now);
                oscillator.frequency.linearRampToValueAtTime(900, now + 0.08);
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.08, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                oscillator.start(now);
                oscillator.stop(now + 0.15);
                break;

            case 'remove':
                oscillator.frequency.setValueAtTime(500, now);
                oscillator.frequency.linearRampToValueAtTime(300, now + 0.1);
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.06, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                oscillator.start(now);
                oscillator.stop(now + 0.12);
                break;

            case 'error':
                oscillator.frequency.setValueAtTime(200, now);
                oscillator.type = 'sawtooth';
                gainNode.gain.setValueAtTime(0.04, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                oscillator.start(now);
                oscillator.stop(now + 0.2);
                break;

            case 'clear':
                oscillator.frequency.setValueAtTime(800, now);
                oscillator.frequency.linearRampToValueAtTime(200, now + 0.25);
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.06, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                oscillator.start(now);
                oscillator.stop(now + 0.3);
                break;

            case 'celebration':
                // Play a little jingle
                [0, 0.1, 0.2].forEach((delay, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.frequency.setValueAtTime([523, 659, 784][i], now + delay);
                    osc.type = 'sine';
                    gain.gain.setValueAtTime(0.06, now + delay);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.2);
                    osc.start(now + delay);
                    osc.stop(now + delay + 0.2);
                });
                return;
        }
    } catch (e) {
        // Audio not available
    }
}

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
        <div class="active-badge"></div>
        <div class="card-top">
            <div class="card-info">
                <div class="card-name">${item.name}</div>
                <div class="card-price">${formatPrice(item.price)}</div>
            </div>
            <div class="card-emoji">${item.emoji}</div>
        </div>
        <div class="quantity-controls">
            <button class="qty-btn minus" data-action="decrement" data-item="${item.id}" aria-label="Remove one ${item.name}" title="Remove one">−</button>
            <div class="qty-display" id="qty-${item.id}" aria-live="polite">0</div>
            <button class="qty-btn plus" data-action="increment" data-item="${item.id}" aria-label="Add one ${item.name}" title="Add one">+</button>
        </div>
        <div class="card-subtotal" id="subtotal-${item.id}">
            Subtotal: <span>$0</span>
        </div>
        <span class="card-tap-hint">tap card to +1</span>
    `;

    // Quick-add: tap the card body to add 1
    card.addEventListener('click', (e) => {
        if (e.target.closest('.qty-btn')) return;
        createRipple(e, card);
        updateQuantity(item.id, 1);
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
    const currentQty = orderState[itemId];
    const newQty = Math.max(0, currentQty + delta);

    // If trying to go below 0, shake
    if (currentQty === 0 && delta < 0) {
        const card = document.getElementById(`card-${itemId}`);
        card.classList.remove('shake');
        void card.offsetWidth;
        card.classList.add('shake');
        playSound('error');
        return;
    }

    // If nothing changed
    if (newQty === currentQty) return;

    orderState[itemId] = newQty;

    // Play sound
    playSound(delta > 0 ? 'add' : 'remove');

    // Float indicator
    showFloatIndicator(itemId, delta);

    // Update display
    const qtyDisplay = document.getElementById(`qty-${itemId}`);
    qtyDisplay.textContent = newQty;
    
    if (newQty > 0) {
        qtyDisplay.classList.add('has-value');
    } else {
        qtyDisplay.classList.remove('has-value');
    }

    // Pop animation
    qtyDisplay.classList.remove('pop');
    void qtyDisplay.offsetWidth;
    qtyDisplay.classList.add('pop');

    // Update card active state
    const card = document.getElementById(`card-${itemId}`);
    if (newQty > 0) {
        card.classList.add('active');
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

    // Update footer & stats
    updateOrderFooter();
    updateStats();
    updateSectionCounts();
}

function showFloatIndicator(itemId, delta) {
    const card = document.getElementById(`card-${itemId}`);
    const indicator = document.createElement('div');
    indicator.className = `float-indicator ${delta > 0 ? 'add' : 'remove'}`;
    indicator.textContent = delta > 0 ? '+1' : '-1';
    indicator.style.right = '16px';
    indicator.style.top = '50%';
    card.appendChild(indicator);

    indicator.addEventListener('animationend', () => indicator.remove());
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
    
    const totalAmountEl = document.getElementById('total-amount');
    totalAmountEl.textContent = formatPrice(totalAmount);

    // Bump animation when total changes
    if (totalAmount !== lastTotal) {
        totalAmountEl.classList.remove('bump');
        void totalAmountEl.offsetWidth;
        totalAmountEl.classList.add('bump');
        lastTotal = totalAmount;
    }

    // Celebration at milestones
    if (totalItems > 0 && totalItems % 10 === 0) {
        triggerConfetti();
        playSound('celebration');
    }

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

function updateStats() {
    const allItems = getAllItems();
    let totalItems = 0;
    let uniqueItems = 0;
    let totalAmount = 0;

    allItems.forEach(item => {
        const qty = orderState[item.id];
        if (qty > 0) {
            totalItems += qty;
            uniqueItems++;
            totalAmount += item.price * qty;
        }
    });

    document.getElementById('stat-items').textContent = totalItems;
    document.getElementById('stat-unique').textContent = uniqueItems;
    document.getElementById('stat-total').textContent = formatPrice(totalAmount);
}

function updateSectionCounts() {
    // Food count
    let foodSelected = 0;
    MENU_ITEMS.food.forEach(item => {
        if (orderState[item.id] > 0) foodSelected++;
    });
    const foodCountEl = document.getElementById('food-count');
    foodCountEl.textContent = `${foodSelected} selected`;
    foodCountEl.classList.toggle('has-selection', foodSelected > 0);

    // Drinks count
    let drinksSelected = 0;
    MENU_ITEMS.drinks.forEach(item => {
        if (orderState[item.id] > 0) drinksSelected++;
    });
    const drinksCountEl = document.getElementById('drinks-count');
    drinksCountEl.textContent = `${drinksSelected} selected`;
    drinksCountEl.classList.toggle('has-selection', drinksSelected > 0);
}

function clearAll() {
    const hasItems = getAllItems().some(item => orderState[item.id] > 0);
    if (!hasItems) return;

    playSound('clear');

    getAllItems().forEach(item => {
        orderState[item.id] = 0;
        
        const qtyDisplay = document.getElementById(`qty-${item.id}`);
        qtyDisplay.textContent = '0';
        qtyDisplay.classList.remove('has-value');
        
        const card = document.getElementById(`card-${item.id}`);
        card.classList.remove('active', 'pulse');
        
        const subtotalEl = document.getElementById(`subtotal-${item.id}`);
        subtotalEl.classList.remove('visible');
    });

    lastTotal = 0;
    orderNumber = Math.floor(Math.random() * 9000) + 1000;
    updateOrderFooter();
    updateStats();
    updateSectionCounts();
}

// ============================================
// Receipt Modal
// ============================================

function openReceipt() {
    const modal = document.getElementById('receipt-modal');
    const body = document.getElementById('modal-body');
    const allItems = getAllItems();
    const activeItems = [];
    let totalAmount = 0;

    allItems.forEach(item => {
        const qty = orderState[item.id];
        if (qty > 0) {
            activeItems.push({ ...item, qty });
            totalAmount += item.price * qty;
        }
    });

    document.getElementById('modal-order-num').textContent = `#${orderNumber}`;
    document.getElementById('modal-total-amount').textContent = formatPrice(totalAmount);

    if (activeItems.length === 0) {
        body.innerHTML = `
            <div class="receipt-empty">
                <div class="receipt-empty-emoji">🌭</div>
                <p>No items in this order yet.<br>Tap menu items to add them!</p>
            </div>
        `;
    } else {
        body.innerHTML = activeItems.map(item => `
            <div class="receipt-item">
                <div class="receipt-item-info">
                    <span class="receipt-item-emoji">${item.emoji}</span>
                    <div class="receipt-item-details">
                        <div class="receipt-item-name">${item.name}</div>
                        <div class="receipt-item-qty">${item.qty} × ${formatPrice(item.price)}</div>
                    </div>
                </div>
                <div class="receipt-item-price">${formatPrice(item.price * item.qty)}</div>
            </div>
        `).join('');
    }

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeReceipt() {
    const modal = document.getElementById('receipt-modal');
    modal.classList.remove('open');
    document.body.style.overflow = '';
}

function newOrder() {
    closeReceipt();
    setTimeout(() => {
        clearAll();
    }, 300);
}

// ============================================
// Confetti 🎉
// ============================================

function triggerConfetti() {
    const container = document.getElementById('confetti-container');
    const colors = ['#ffc837', '#ff8008', '#ff4757', '#2ed573', '#5352ed', '#ff6b81', '#eccc68'];
    const shapes = ['square', 'circle'];

    for (let i = 0; i < 40; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        const color = colors[Math.floor(Math.random() * colors.length)];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const size = Math.random() * 8 + 6;
        const left = Math.random() * 100;
        const duration = Math.random() * 1.5 + 1.5;
        const delay = Math.random() * 0.5;

        piece.style.cssText = `
            left: ${left}%;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            border-radius: ${shape === 'circle' ? '50%' : '2px'};
            animation-duration: ${duration}s;
            animation-delay: ${delay}s;
        `;

        container.appendChild(piece);

        setTimeout(() => piece.remove(), (duration + delay) * 1000 + 100);
    }
}

// ============================================
// Ambient Particles
// ============================================

function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationFrame;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function createParticle() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 1.5 + 0.5,
            speedX: (Math.random() - 0.5) * 0.3,
            speedY: (Math.random() - 0.5) * 0.3,
            opacity: Math.random() * 0.3 + 0.1,
            pulse: Math.random() * Math.PI * 2
        };
    }

    function init() {
        resize();
        particles = [];
        // Fewer particles on mobile for performance
        const count = window.innerWidth < 768 ? 25 : 50;
        for (let i = 0; i < count; i++) {
            particles.push(createParticle());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY;
            p.pulse += 0.01;

            // Wrap around
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;

            const currentOpacity = p.opacity * (0.5 + 0.5 * Math.sin(p.pulse));

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 200, 55, ${currentOpacity})`;
            ctx.fill();
        });

        animationFrame = requestAnimationFrame(animate);
    }

    // Handle visibility
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animationFrame);
        } else {
            animate();
        }
    });

    window.addEventListener('resize', () => {
        resize();
    });

    init();
    animate();
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
        const modal = document.getElementById('receipt-modal');
        if (modal.classList.contains('open')) {
            closeReceipt();
        } else {
            clearAll();
        }
    }
});

// ============================================
// Sound Toggle
// ============================================

function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('sound-toggle');
    const onIcon = btn.querySelector('.sound-on');
    const offIcon = btn.querySelector('.sound-off');

    if (soundEnabled) {
        btn.classList.add('active');
        onIcon.style.display = '';
        offIcon.style.display = 'none';
    } else {
        btn.classList.remove('active');
        onIcon.style.display = 'none';
        offIcon.style.display = '';
    }
}

// ============================================
// Init
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    renderMenuItems();
    initParticles();
    updateStats();
    updateSectionCounts();
    
    // Sound toggle
    const soundBtn = document.getElementById('sound-toggle');
    soundBtn.classList.add('active');
    soundBtn.addEventListener('click', toggleSound);

    // Clear all button
    document.getElementById('clear-all-btn').addEventListener('click', clearAll);

    // Receipt button
    document.getElementById('receipt-btn').addEventListener('click', openReceipt);
    document.getElementById('modal-close').addEventListener('click', closeReceipt);
    document.getElementById('new-order-btn').addEventListener('click', newOrder);

    // Close modal on overlay click
    document.getElementById('receipt-modal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeReceipt();
    });
});
