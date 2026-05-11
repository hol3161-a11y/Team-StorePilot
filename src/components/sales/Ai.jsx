'use client';
import TypeIt from 'typeit-react';
import useAIStore from '@/store/aiStore';

export default function SalesCallAi() {
    const { sales, loading } = useAIStore();

    if (loading.sales) return (<p>AI 분석 중...</p>);
    if (!sales) return (<p>매출 데이터가 없습니다.</p>);

    const trendColor = sales.trend === '상승' ? '#85D575' : '#F34C4C';

    return (
        <TypeIt
            options={{ speed: 20, html: true, cursor: false }}
            getBeforeInit={(instance) => {
                instance
                    .type(`<strong style="font-size:20px">오늘 예상 매출: <span style="color:#76DE99">${sales.predictedAmount.toLocaleString()}원</span></strong>`)
                    .pause(200)
                    .type(`<br/><br/>트렌드: <span style="color:${trendColor}">${sales.trend}</span>`)
                    .pause(200)
                    .type(`<br/><br/>${sales.summary}`)
                    .pause(200)
                    .type(`<br/><br/>💡 ${sales.advice}`);
                return instance;
            }}
        />
    );
}
