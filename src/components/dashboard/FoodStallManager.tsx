import { useState, useEffect } from 'react';
import { useFoodStore } from '../../store/useFoodStore';
import type { StallData, MenuItem } from '../../store/useFoodStore';
import { useAlertStore } from '../../store/useAlertStore';
import { ForkKnife, ChevronLeft, ShoppingBag, Clock, MapPin, Plus, X, CheckCircle2 } from 'lucide-react';

export default function FoodStallManager() {
  const {
    stalls, cart, orders, isModalOpen, setIsModalOpen,
    currentStallId, setCurrentStallId, addToCart, removeFromCart,
    placeOrder, markOrderPickedUp
  } = useFoodStore();

  const { addAlert } = useAlertStore();

  const [activeTab, setActiveTab] = useState<'list' | 'menu' | 'orders'>('list');

  // Sync tab with stall selection
  useEffect(() => {
    if (currentStallId && activeTab === 'list') {
      setActiveTab('menu');
    } else if (!currentStallId && activeTab === 'menu') {
      setActiveTab('list');
    }
  }, [currentStallId, activeTab]);

  const activeOrders = orders.filter(o => o.status !== 'picked_up');
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePlaceOrder = () => {
    placeOrder();
    setActiveTab('orders');
    setCurrentStallId(null);
    addAlert({
      title: '🍔 Order Placed!',
      body: `Your order is confirmed. We will notify you when it's ready.`,
      severity: 'info',
      source: 'system' as const,
    });
  };

  // The wrapper handles the transition/animation based on isModalOpen
  return (
    <>
      {/* ── DESKTOP SLIDE-OVER (Visible lg and up) ───────────────────────── */}
      <div
        className={`hidden lg:flex fixed top-24 right-6 bottom-24 w-[400px] z-40 transition-transform duration-500 ease-in-out ${isModalOpen ? 'translate-x-0' : 'translate-x-[150%]'
          }`}
      >
        <div className="glass-panel w-full h-full rounded-3xl border border-white/10 flex flex-col overflow-hidden shadow-2xl">
          <Header title="Food Stalls" onClose={() => setIsModalOpen(false)} />
          <div className="flex-1 overflow-y-auto w-full flex flex-col relative bg-pureBlack/80">
            {activeTab === 'list' && <StallListView onSelect={setCurrentStallId} stalls={Object.values(stalls)} />}
            {activeTab === 'menu' && currentStallId && (
              <MenuView
                stall={stalls[currentStallId]}
                onBack={() => setCurrentStallId(null)}
                cart={cart}
                onAdd={(item: MenuItem) => addToCart(item, currentStallId)}
                onRemove={removeFromCart}
              />
            )}
            {activeTab === 'orders' && <OrdersView orders={activeOrders} onPickUp={markOrderPickedUp} />}
          </div>
          <Footer activeTab={activeTab} setActiveTab={setActiveTab} ordersCount={activeOrders.length} cartTotal={cartTotal} onCheckout={handlePlaceOrder} />
        </div>
      </div>

      {/* ── MOBILE BOTTOM SHEET (Visible md and down) ────────────────────── */}
      <div
        className={`lg:hidden fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-500 ease-in-out flex flex-col max-h-[85vh] ${isModalOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
      >
        <div className="glass-panel rounded-t-3xl border-b-0 flex-1 w-full flex flex-col overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.8)] pb-6 bg-pureBlack/95">
          <div className="w-12 h-1.5 bg-borderSecondary rounded-full mx-auto my-3 cursor-pointer flex-shrink-0" onClick={() => setIsModalOpen(false)} />
          <div className="px-4 pb-2 flex-shrink-0">
            <h3 className="font-black text-xl text-white tracking-tight flex items-center gap-2">
              <ForkKnife className="w-6 h-6 text-accentEmerald" />
              Food Options
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto px-4 flex flex-col relative w-full">
            {activeTab === 'list' && <StallListView onSelect={setCurrentStallId} stalls={Object.values(stalls)} />}
            {activeTab === 'menu' && currentStallId && (
              <MenuView
                stall={stalls[currentStallId]}
                onBack={() => setCurrentStallId(null)}
                cart={cart}
                onAdd={(item: MenuItem) => addToCart(item, currentStallId)}
                onRemove={removeFromCart}
              />
            )}
            {activeTab === 'orders' && <OrdersView orders={activeOrders} onPickUp={markOrderPickedUp} />}
          </div>

          <div className="px-4 mt-2 flex-shrink-0">
            <Footer rounded activeTab={activeTab} setActiveTab={setActiveTab} ordersCount={activeOrders.length} cartTotal={cartTotal} onCheckout={handlePlaceOrder} />
          </div>
        </div>
      </div>
    </>
  );
}

// ── View Components ────────────────────────────────────────────────────────

const Header = ({ title, onClose }: { title: string, onClose: () => void }) => (
  <div className="flex items-center justify-between px-5 py-4 border-b border-borderPrimary bg-pureBlack/50 flex-shrink-0">
    <h2 className="text-lg font-black text-white flex items-center gap-2 tracking-tight">
      <ForkKnife className="w-5 h-5 text-accentEmerald" /> {title}
    </h2>
    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface text-textSecondary hover:text-white transition-colors">
      <X className="w-5 h-5" />
    </button>
  </div>
);

const Footer = ({ activeTab, setActiveTab, ordersCount, cartTotal, onCheckout, rounded = false }: any) => (
  <div className={`mt-auto bg-surface border-t border-borderPrimary p-3 flex gap-2 ${rounded ? 'rounded-2xl' : ''}`}>
    <button onClick={() => setActiveTab('list')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${activeTab === 'list' || activeTab === 'menu' ? 'bg-pureBlack text-white border border-borderSecondary/50' : 'text-textSecondary hover:text-white'}`}>
      Discover
    </button>
    <button onClick={() => setActiveTab('orders')} className={`flex-1 py-2 rounded-xl text-xs font-bold relative transition-colors ${activeTab === 'orders' ? 'bg-pureBlack text-white border border-borderSecondary/50' : 'text-textSecondary hover:text-white'}`}>
      Orders {ordersCount > 0 && <span className="absolute top-1.5 right-4 w-2 h-2 rounded-full bg-accentRose" />}
    </button>

    {(activeTab === 'menu' && cartTotal > 0) && (
      <button onClick={onCheckout} className="flex-[1.5] bg-accentEmerald hover:bg-accentEmerald/90 text-pureBlack font-bold py-2 rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] flex items-center justify-center gap-1.5 animate-slideUp">
        <ShoppingBag className="w-4 h-4" /> ${cartTotal} - Checkout
      </button>
    )}
  </div>
);

const StallListView = ({ stalls, onSelect }: { stalls: StallData[], onSelect: (id: string) => void }) => (
  <div className="flex flex-col gap-3 py-2">
    {stalls.map(stall => (
      <div
        key={stall.id}
        onClick={() => stall.isOpen ? onSelect(stall.id) : null}
        className={`border rounded-2xl p-4 transition-all ${stall.isOpen
          ? 'bg-surface/50 border-borderSecondary/50 hover:bg-surface/80 cursor-pointer'
          : 'bg-pureBlack/50 border-borderPrimary/30 opacity-60 cursor-not-allowed'
          }`}
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className="font-bold text-white text-base leading-tight">{stall.name}</h4>
            <span className="text-xs text-textSecondary">{stall.category}</span>
          </div>
          {!stall.isOpen ? (
            <span className="text-[10px] bg-accentRose/10 text-accentRose border border-accentRose/20 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Closed
            </span>
          ) : (
            <span className="text-[10px] bg-accentEmerald/20 text-accentEmerald font-bold px-2 py-0.5 rounded-full uppercase">
              Open
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 mt-3 text-xs text-textSecondary">
          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {stall.near}</span>
          {stall.isOpen && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> ~{stall.prepTimeMinutes}m wait</span>}
          {!stall.isOpen && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 overflow-visible" /> Opens {stall.openTime}</span>}
        </div>
      </div>
    ))}
  </div>
);

const MenuView = ({ stall, onBack, cart, onAdd }: any) => {
  return (
    <div className="flex flex-col py-2 h-full">
      <button onClick={onBack} className="text-xs text-textSecondary hover:text-white font-bold flex items-center gap-1 mb-4 self-start">
        <ChevronLeft className="w-4 h-4" /> Back to List
      </button>

      <div className="mb-5 border-b border-borderPrimary pb-4">
        <h3 className="text-xl font-black text-white">{stall.name}</h3>
        <p className="text-xs text-textSecondary mt-1">Wait time: ~{stall.prepTimeMinutes} minutes</p>
      </div>

      <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1">
        {stall.menu.map((item: MenuItem) => {
          const qty = cart.filter((c: any) => c.menuItemId === item.id).reduce((sum: number, c: any) => sum + c.quantity, 0);

          return (
            <div key={item.id} className="bg-surface/40 border border-borderSecondary/30 rounded-xl p-3 flex justify-between items-center group hover:bg-surface/60 transition-colors">
              <div>
                <p className="font-bold text-white text-sm">{item.name}</p>
                <p className="text-accentEmerald font-black text-xs mt-0.5">${item.price.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2">
                {qty > 0 && (
                  <span className="text-xs font-bold text-white bg-pureBlack rounded-md w-6 h-6 flex items-center justify-center border border-borderSecondary">
                    {qty}
                  </span>
                )}
                <button
                  onClick={() => onAdd(item)}
                  className="w-8 h-8 rounded-lg bg-surface hover:bg-white text-white hover:text-pureBlack border border-borderSecondary flex items-center justify-center transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const OrdersView = ({ orders, onPickUp }: { orders: any[], onPickUp: (id: string) => void }) => {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-textSecondary py-20 gap-3">
        <ShoppingBag className="w-10 h-10 opacity-20" />
        <p className="text-sm">No active orders</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-2">
      {orders.map(order => (
        <div key={order.id} className="bg-surface/50 border border-borderSecondary/50 rounded-2xl p-4 flex flex-col relative overflow-hidden">
          {order.status === 'ready' && <div className="absolute top-0 left-0 w-full h-1 bg-accentEmerald animate-pulse" />}

          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-[10px] text-textSecondary uppercase tracking-widest font-bold">Order #{order.id}</p>
              <h4 className="font-black text-white">{order.stallName}</h4>
            </div>
            {order.status === 'preparing' ? (
              <span className="text-[10px] bg-accentWarning/20 text-accentWarning font-bold px-2 py-1 rounded-full uppercase flex items-center gap-1 border border-accentWarning/20">
                <Clock className="w-3 h-3" /> Preparing
              </span>
            ) : (
              <span className="text-[10px] bg-accentEmerald/20 text-accentEmerald font-bold px-2 py-1 rounded-full uppercase flex items-center gap-1 border border-accentEmerald/20">
                <CheckCircle2 className="w-3 h-3" /> Ready
              </span>
            )}
          </div>

          <ul className="text-xs text-textSecondary mb-4 space-y-1">
            {order.items.map((it: any, i: number) => (
              <li key={i}>{it.quantity}x {it.name}</li>
            ))}
          </ul>

          {order.status === 'ready' && (
            <button
              onClick={() => onPickUp(order.id)}
              className="mt-auto w-full py-2 bg-white text-pureBlack font-bold text-sm rounded-xl hover:bg-gray-200 transition-colors"
            >
              Mark as Picked Up
            </button>
          )}
          {order.status === 'preparing' && (
            <div className="mt-auto pt-2 border-t border-borderPrimary w-full">
              <p className="text-[10px] text-textSecondary text-center">We'll notify you when it's ready.</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
