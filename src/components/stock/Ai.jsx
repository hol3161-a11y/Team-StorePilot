'use client';
import useAIStore from '@/store/aiStore';

export default function StockCallAi() {
    const { stock, loading } = useAIStore();

    if (loading.stock) return (<p>AI 분석 중...</p>);
    if (!stock) return (<p>매출 데이터가 없습니다.</p>);

    return (
        <></>
    );
}
