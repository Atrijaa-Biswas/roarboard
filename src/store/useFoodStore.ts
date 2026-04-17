import { create } from 'zustand';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
}

export interface StallData {
  id: string;
  name: string;
  category: string;
  near: string; // The zone/gate it's near
  menu: MenuItem[];
  isOpen: boolean;
  openTime: string; // "10:00 AM"
  closeTime: string; // "10:00 PM"
  prepTimeMinutes: number;
}

export interface CartItem {
  cartItemId: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  stallId: string;
  stallName: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  status: 'preparing' | 'ready' | 'picked_up';
  placedAt: number;
  estimatedReadyAt: number;
}

interface FoodState {
  stalls: Record<string, StallData>;
  cart: CartItem[];
  currentStallId: string | null;
  orders: Order[];
  isModalOpen: boolean;
  
  // Actions
  setIsModalOpen: (isOpen: boolean) => void;
  setCurrentStallId: (id: string | null) => void;
  
  // Cart Actions
  addToCart: (item: MenuItem, stallId: string) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  
  // Order Actions
  placeOrder: () => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  markOrderPickedUp: (orderId: string) => void;

  // Staff Actions
  updateStallStatus: (stallId: string, updates: Partial<StallData>) => void;
}

const initialStalls: Record<string, StallData> = {
  's1': {
    id: 's1', name: 'Gate A Burgers', category: 'American', near: 'Gate A',
    isOpen: true, openTime: '11:00 AM', closeTime: '11:00 PM', prepTimeMinutes: 10,
    menu: [
      { id: 'm1', name: 'Classic Burger', price: 8 },
      { id: 'm2', name: 'Cheese Fries', price: 5 },
      { id: 'm3', name: 'Soda', price: 3 }
    ]
  },
  's2': {
    id: 's2', name: 'Taco Stand', category: 'Mexican', near: 'Gate B',
    isOpen: true, openTime: '12:00 PM', closeTime: '10:00 PM', prepTimeMinutes: 5,
    menu: [
      { id: 'm4', name: 'Beef Taco', price: 4 },
      { id: 'm5', name: 'Quesadilla', price: 6 },
      { id: 'm6', name: 'Guac & Chips', price: 5 }
    ]
  },
  's3': {
    id: 's3', name: 'Pizza Slice', category: 'Italian', near: 'Gate C',
    isOpen: true, openTime: '11:30 AM', closeTime: '11:30 PM', prepTimeMinutes: 8,
    menu: [
      { id: 'm7', name: 'Pepperoni Slice', price: 5 },
      { id: 'm8', name: 'Garlic Knots', price: 4 },
      { id: 'm9', name: 'Drink', price: 2 }
    ]
  },
  's4': {
    id: 's4', name: 'Sushi Roll', category: 'Japanese', near: 'Gate D',
    isOpen: false, openTime: '01:00 PM', closeTime: '09:00 PM', prepTimeMinutes: 12,
    menu: [
      { id: 'm10', name: 'California Roll', price: 7 },
      { id: 'm11', name: 'Miso Soup', price: 4 },
      { id: 'm12', name: 'Edamame', price: 3 }
    ]
  },
  's5': {
    id: 's5', name: 'Wing Zone', category: 'American', near: 'Gate E',
    isOpen: true, openTime: '12:00 PM', closeTime: '12:00 AM', prepTimeMinutes: 15,
    menu: [
      { id: 'm13', name: '6 Wings', price: 9 },
      { id: 'm14', name: 'Celery & Carrots', price: 2 },
      { id: 'm15', name: 'Ranch', price: 1 }
    ]
  },
  's6': {
    id: 's6', name: 'Falafel Cart', category: 'Middle Eastern', near: 'Gate F',
    isOpen: true, openTime: '10:00 AM', closeTime: '10:00 PM', prepTimeMinutes: 6,
    menu: [
      { id: 'm16', name: 'Falafel Pita', price: 6 },
      { id: 'm17', name: 'Hummus', price: 4 },
      { id: 'm18', name: 'Baklava', price: 3 }
    ]
  }
};

export const useFoodStore = create<FoodState>((set, get) => ({
  stalls: initialStalls,
  cart: [],
  currentStallId: null,
  orders: [],
  isModalOpen: false,

  setIsModalOpen: (isOpen) => set({ isModalOpen: isOpen }),
  
  setCurrentStallId: (id) => set((state) => {
    // If switching stalls, we might want to clear the cart, but let's just do it
    if (id !== state.currentStallId && state.cart.length > 0 && id !== null) {
      return { currentStallId: id, cart: [] }; // Reset cart when changing stalls
    }
    return { currentStallId: id };
  }),

  addToCart: (item, stallId) => set((state) => {
    // First assure stall matches Cart
    if (state.currentStallId !== stallId && state.cart.length > 0) {
      return { currentStallId: stallId, cart: [{ cartItemId: Math.random().toString(36).substring(7), menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }] };
    }
    
    const existingIndex = state.cart.findIndex(c => c.menuItemId === item.id);
    if (existingIndex >= 0) {
      const newCart = [...state.cart];
      newCart[existingIndex].quantity += 1;
      return { cart: newCart, currentStallId: stallId };
    }
    
    return { 
      cart: [...state.cart, { cartItemId: Math.random().toString(36).substring(7), menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }],
      currentStallId: stallId
    };
  }),

  removeFromCart: (cartItemId) => set((state) => ({
    cart: state.cart.filter(c => c.cartItemId !== cartItemId)
  })),

  clearCart: () => set({ cart: [] }),

  placeOrder: () => {
    const state = get();
    if (!state.currentStallId || state.cart.length === 0) return;
    
    const stall = state.stalls[state.currentStallId];
    const total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const orderId = Math.random().toString(36).substring(7).toUpperCase();
    
    const newOrder: Order = {
      id: orderId,
      stallId: stall.id,
      stallName: stall.name,
      items: state.cart.map(c => ({ name: c.name, quantity: c.quantity, price: c.price })),
      total,
      status: 'preparing',
      placedAt: Date.now(),
      estimatedReadyAt: Date.now() + (stall.prepTimeMinutes * 60000)
    };

    set({ orders: [newOrder, ...state.orders], cart: [] });

    // Simulate order ready after prepTimeMinutes (scaled down for demo visually, maybe 15 seconds)
    setTimeout(() => {
      get().updateOrderStatus(orderId, 'ready');
    }, 15000); // 15 seconds instead of real minutes for UX purposes
  },

  updateOrderStatus: (orderId, status) => set((state) => ({
    orders: state.orders.map(o => o.id === orderId ? { ...o, status } : o)
  })),

  markOrderPickedUp: (orderId) => set((state) => ({
    orders: state.orders.map(o => o.id === orderId ? { ...o, status: 'picked_up' } : o)
  })),

  updateStallStatus: (stallId, updates) => set((state) => ({
    stalls: {
      ...state.stalls,
      [stallId]: { ...state.stalls[stallId], ...updates }
    }
  }))
}));
