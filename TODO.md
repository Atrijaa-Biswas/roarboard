# Task: Fix duplicate chatbot icons & add Food Stall Finder

## Plan Breakdown & Progress

### 1. [x] Create TODO.md with steps (done)

### 2. [] Read & analyze src/pages/AttendeeView.tsx (already read)

### 3. [x] Create Food Stall Finder modal/component in AttendeeView.tsx
   - Replace center bottom nav AI Sparkles button with ForkKnife icon + 'Food' badge ✓
   - Add fixed bottom-center modal toggle (glass-panel, stalls list) ✓
   - Mock 6 stalls data (name, gate, 3-4 menu items, Order button → toast) ✓

### 4. [x] Implement stall modal JSX
   - List view: stall name, location (near gate), sample menu ✓
   - 'Browse Menu' → sublist, 'Place Order' → mock alert/toast ✓

### 5. [x] Style consistently (glassmorphism, Tailwind responsive, accentEmerald theme) ✓

### 6. [] Test responsive views
   - Mobile: 1 chatbot FAB (right), Food center bottom nav, toggle modal
   - Tablet/Desktop: unchanged (chat panel + FAB right)

### 7. [] Verify no layout breaks, attempt_completion

**Current status: Ready for implementation**
