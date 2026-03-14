// ===================================================
// Flavos IA 3.0 — useSidebar Store
// ===================================================
// Estado global da sidebar: open/closed e pinned mode.
// Compartilhado entre Sidebar.tsx e Chat.tsx.
// ===================================================

import { create } from 'zustand';

interface SidebarState {
  isOpen: boolean;
  isPinned: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  togglePin: () => void;
}

export const useSidebar = create<SidebarState>((set, get) => ({
  isOpen: false,
  isPinned: false,

  open: () => set({ isOpen: true }),
  close: () => {
    // Não fecha se estiver fixada
    if (!get().isPinned) set({ isOpen: false });
  },
  toggle: () => {
    const { isOpen, isPinned } = get();
    // Em modo fixado, o toggle vira o pin (desfixar + fechar)
    if (isPinned) {
      set({ isPinned: false, isOpen: false });
    } else {
      set({ isOpen: !isOpen });
    }
  },
  togglePin: () => {
    const { isPinned } = get();
    // Fixar: abre a sidebar permanentemente, remove overlay
    // Desafixar: volta ao modo overlay e fecha
    set({ isPinned: !isPinned, isOpen: !isPinned });
  },
}));
