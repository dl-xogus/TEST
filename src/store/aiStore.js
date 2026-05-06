import { create } from 'zustand';
import axios from 'axios';

const useAIStore = create((set, get) => ({
  sales: null,      // salesPrompt 결과
  menu: null,       // menuPrompt 결과
  schedule: null,   // schedulePrompt 결과
  stock: null,      // stockPrompt 결과
  loading: { sales: true, menu: true, schedule: true, stock: true },

  fetchAll: () => {
    /* 이미 fetch 시작했으면 중복 호출 방지 */
    if (!get().loading.sales && !get().loading.menu && !get().loading.schedule && !get().loading.stock) return;

    /* 매출 관리 AI 호출 */
    axios.post('/api/ai', { keyword: 'sales' })
      .then(res => set({ sales: res.data, loading: { ...get().loading, sales: false } }))
      .catch(() => set({ loading: { ...get().loading, sales: false } }));

    /* 메뉴 관리 AI 호출 */
    axios.post('/api/ai', { keyword: 'menu' })
      .then(res => set({ menu: res.data, loading: { ...get().loading, menu: false } }))
      .catch(() => set({ loading: { ...get().loading, menu: false } }));

    /* 근무표 AI 호출 */     // 근무표 AI 프롬프트 만들면 주석 풀기
    // axios.post('/api/ai', { keyword: 'schedule' })
    //   .then(res => set({ schedule: res.data, loading: { ...get().loading, schedule: false } }))
    //   .catch(() => set({ loading: { ...get().loading, schedule: false } }));

    /* 재고 관리 AI 호출 */   // 재고 관리 AI 프롬프트 만들면 주석 풀기
    // axios.post('/api/ai', { keyword: 'stock' })
    //   .then(res => set({ stock: res.data, loading: { ...get().loading, stock: false } }))
    //   .catch(() => set({ loading: { ...get().loading, stock: false } }));
  },
}));

export default useAIStore;
