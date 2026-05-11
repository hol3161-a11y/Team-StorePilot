"use client"
import { ResponsiveLine } from "@nivo/line";

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const WEEKS = ['1주차', '2주차', '3주차', '4주차', '5주차'];
const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

const getWeekOfMonth = (date) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  return Math.ceil((firstDay + date.getDate()) / 7);
};

// 특정 연/월/주차/요일(0=일)에 해당하는 날짜 문자열 반환 (해당 월에 없으면 null)
const getDateLabel = (year, month, week, dayOfWeek) => {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const d = (week - 1) * 7 + dayOfWeek - firstDay + 1;
  const maxDay = new Date(year, month, 0).getDate();
  if (d < 1 || d > maxDay) return null;
  return `${String(month).padStart(2, '0')}.${String(d).padStart(2, '0')}`;
};

// salesData에서 activeTab/selected 기준으로 현재 + 비교 데이터를 nivo 형식으로 변환
const buildChartData = (salesData, activeTab, selected) => {
  const selYear = parseInt(selected.year);
  const selMonth = parseInt(selected.month);
  const selWeek = parseInt(selected.week);

  if (activeTab === '일별') {
    // 이번주 (선택한 주차) / 지난주 (선택 주차 - 1) 의 요일별 매출
    const thisWeek = Array(7).fill(0);
    const lastWeek = Array(7).fill(0);

    const prevMonth = selMonth === 1 ? 12 : selMonth - 1;
    const prevYear = selMonth === 1 ? selYear - 1 : selYear;
    const prevWeek = selWeek > 1 ? selWeek - 1 : getWeekOfMonth(new Date(prevYear, prevMonth, 0));

    salesData.forEach(item => {
      const d = new Date(item.date);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const w = getWeekOfMonth(d);
      const day = d.getDay(); // 0=일 ~ 6=토

      if (y === selYear && m === selMonth && w === selWeek) {
        thisWeek[day] += Number(item.dailySales);
      }
      // 지난주: 같은 달 이전 주차 or 전달 마지막 주
      if (selWeek > 1) {
        if (y === selYear && m === selMonth && w === selWeek - 1) {
          lastWeek[day] += Number(item.dailySales);
        }
      } else {
        if (y === prevYear && m === prevMonth && w === prevWeek) {
          lastWeek[day] += Number(item.dailySales);
        }
      }
    });

    return [
      {
        id: '이번주', color: '#76DE99',
        data: DAYS.map((label, i) => ({ x: label, y: thisWeek[i], date: getDateLabel(selYear, selMonth, selWeek, i) })),
      },
      {
        id: '지난주', color: '#F34C4C',
        data: DAYS.map((label, i) => ({
          x: label, y: lastWeek[i],
          date: selWeek > 1
            ? getDateLabel(selYear, selMonth, selWeek - 1, i)
            : getDateLabel(prevYear, prevMonth, prevWeek, i),
        })),
      },
    ];
  }

  if (activeTab === '주별') {
    // 선택한 월 / 지난달 의 주차별 매출 합산
    const thisMonth = Array(5).fill(0);
    const lastMonth = Array(5).fill(0);
    const prevMonth = selMonth === 1 ? 12 : selMonth - 1;
    const prevYear = selMonth === 1 ? selYear - 1 : selYear;

    salesData.forEach(item => {
      const d = new Date(item.date);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const w = getWeekOfMonth(d) - 1; // 0-indexed

      if (y === selYear && m === selMonth && w >= 0 && w < 5) {
        thisMonth[w] += Number(item.dailySales);
      }
      if (y === prevYear && m === prevMonth && w >= 0 && w < 5) {
        lastMonth[w] += Number(item.dailySales);
      }
    });

    // 데이터가 있는 주차까지만 표시
    const maxWeek = Math.max(
      ...salesData
        .filter(item => { const d = new Date(item.date); return d.getFullYear() === selYear && d.getMonth() + 1 === selMonth; })
        .map(item => getWeekOfMonth(new Date(item.date))),
      1
    );
    const labels = WEEKS.slice(0, maxWeek);

    return [
      { id: '이번달', color: '#76DE99', data: labels.map((label, i) => ({ x: label, y: thisMonth[i] })) },
      { id: '지난달', color: '#F34C4C', data: labels.map((label, i) => ({ x: label, y: lastMonth[i] })) },
    ];
  }

  if (activeTab === '월별') {
    // 선택한 연도 / 작년 의 월별 매출 합산
    const thisYear = Array(12).fill(0);
    const lastYear = Array(12).fill(0);

    salesData.forEach(item => {
      const d = new Date(item.date);
      const y = d.getFullYear();
      const m = d.getMonth(); // 0-indexed

      if (y === selYear) thisYear[m] += Number(item.dailySales);
      if (y === selYear - 1) lastYear[m] += Number(item.dailySales);
    });

    return [
      { id: '올해', color: '#76DE99', data: MONTHS.map((label, i) => ({ x: label, y: thisYear[i] })) },
      { id: '작년', color: '#F34C4C', data: MONTHS.map((label, i) => ({ x: label, y: lastYear[i] })) },
    ];
  }

  return [];
};

const theme = {
  background: "transparent",
  textColor: "#aaaaaa",
  fontSize: 14,
  axis: {
    domain: { line: { stroke: "transparent" } },
    ticks: {
      line: { stroke: "transparent" },
      text: { fill: "#aaaaaa", fontSize: 14 },
    },
  },
  grid: { line: { stroke: "#3F3E41", strokeWidth: 1 } },
  crosshair: { line: { stroke: "#76DE99", strokeWidth: 1 } },
};

export default function Chart({ salesData = [], activeTab = '일별', selected = {} }) {
  const chartData = buildChartData(salesData, activeTab, selected);

  const allValues = chartData.flatMap(s => s.data.map(d => d.y));
  const maxVal = Math.max(...allValues, 0);
  const yMax = Math.ceil(maxVal * 1.2 / 100000) * 100000 || 500000;

  const formatY = (v) => {
    if (v === 0) return '0';
    if (v >= 10000) return `${(v / 10000).toFixed(0)}만`;
    return v.toLocaleString();
  };

  return (
    <div style={{ borderRadius: 12, width: "100%", height: 260 }}>
      <ResponsiveLine
        data={chartData}
        theme={theme}
        margin={{ top: 10, right: 20, bottom: 30, left: 60 }}
        xScale={{ type: "point" }}
        yScale={{ type: "linear", min: 0, max: yMax }}
        curve="linear"
        colors={chartData.map(s => s.color)}
        lineWidth={2}
        pointSize={7}
        pointColor={{ from: 'color' }}
        pointBorderWidth={0}
        enableArea={false}
        enableGridX={true}
        enableGridY={true}
        layers={[
          ({ innerWidth, innerHeight }) => (
            <rect width={innerWidth} height={innerHeight} fill="#26272A" />
          ),
          'grid', 'markers', 'axes', 'areas', 'lines',
          ({ points }) => (
            <g>
              {points.map(point => (
                <circle
                  key={point.id}
                  cx={point.x}
                  cy={point.y}
                  r={3.5}
                  fill={/^(지난주|지난달|작년)\./.test(point.id) ? '#F34C4C' : '#76DE99'}
                />
              ))}
            </g>
          ),
          'slices', 'mesh', 'legends',
        ]}
        axisBottom={{ tickSize: 0, tickPadding: 12 }}
        axisLeft={{ tickSize: 0, tickPadding: 12, format: formatY, tickValues: Array.from({ length: 6 }, (_, i) => Math.round(yMax / 5 * i)) }}
        gridYValues={Array.from({ length: 6 }, (_, i) => Math.round(yMax / 5 * i))}
        legends={[{
          anchor: 'top-right',
          direction: 'row',
          itemWidth: 60,
          itemHeight: 20,
          symbolSize: 10,
          itemTextColor: '#aaaaaa',
        }]}
        tooltip={({ point }) => (
          <div style={{
              background: "rgba(26, 26, 26, 0.8)",
              border: /^(지난주|지난달|작년)\./.test(point.id) ? '1px solid #F34C4C' : '1px solid #76DE99',
              borderRadius: 5, padding: "6px 12px", color: "#e8e8e8", fontSize: 13,
              display: "inline-flex", whiteSpace: "nowrap", justifyContent: "space-between"
          }}>
            <strong style={{ color: point.color }}>{point.serieId}</strong>
            <span style={{ color: "#B5B5B5" }}>{point.data.date ? `${point.data.date}(${point.data.x})` : point.data.x}</span>
            <span style={{ padding: "0 0 0 10px", fontWeight: "bold" }}>{Number(point.data.y).toLocaleString()}원</span>
          </div>
        )}
        useMesh={true}
        animate={true}
        motionConfig="gentle"
      />
    </div>
  );
}
