import { create } from 'zustand';
import axios from 'axios';

const useAIStore = create((set, get) => ({
  sales: null,      // salesPrompt 결과
  menu: null,       // menuPrompt 결과
  schedule: null,   // schedulePrompt 결과
  stock: null,      // stockPrompt 결과
  category: null,   // categoryPrompt 결과
  loading: { sales: true, menu: true, schedule: true, stock: true },

  fetchAll: (ownerId) => {
    if (!ownerId) return;

    /* 이미 fetch 시작했으면 중복 호출 방지 */
    if (!get().loading.sales && !get().loading.menu && !get().loading.schedule && !get().loading.stock) return;

    /* 매출 관리 AI 호출 */
    axios.post('/api/ai', { keyword: 'sales', ownerId })
      .then(res => set({ sales: res.data, loading: { ...get().loading, sales: false } }))
      .catch(() => set({ loading: { ...get().loading, sales: false } }));

    /* 메뉴 관리 AI 호출 */
    axios.post('/api/ai', { keyword: 'menu', ownerId })
      .then(res => set({ menu: res.data, loading: { ...get().loading, menu: false } }))
      .catch(() => set({ loading: { ...get().loading, menu: false } }));

    /* 근무표 AI 호출 */
    axios.post('/api/ai', { keyword: 'schedule', ownerId })
      .then(res => set({ schedule: res.data, loading: { ...get().loading, schedule: false } }))
      .catch(() => set({ loading: { ...get().loading, schedule: false } }));

    /* 재고 관리 AI 호출 */                                                   // 재고 관리 AI 프롬프트 만들면 주석 풀기
    // axios.post('/api/ai', { keyword: 'stock', ownerId })
    //   .then(res => set({ stock: res.data, loading: { ...get().loading, stock: false } }))
    //   .catch(() => set({ loading: { ...get().loading, stock: false } }));

    /* 카테고리 추천 AI 호출 */
    axios.post('/api/ai', { keyword: 'category', ownerId })
      .then(res => set({ category: res.data, loading: { ...get().loading, category: false } }))
      .catch(() => set({ loading: { ...get().loading, category: false } }));
  },
  
  user: null,
}));

export default useAIStore;
