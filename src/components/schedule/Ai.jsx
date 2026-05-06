'use client';
import useAIStore from '@/store/aiStore';

export default function ScheduleCallAi() {
    const { schedule, loading } = useAIStore();

    if (loading.schedule) return (<p>AI 분석 중...</p>);
    if (!schedule) return (<p>매출 데이터가 없습니다.</p>);

    return (
        <></>
    );
}
