import { Button, Card, Space, Tag, Tooltip, Typography } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { api } from "../../lib/api";
import { useRealtimeEvent } from "../../hooks/use-realtime";

type ScheduleOrder = {
  id: string;
  orderNo: string;
  productName: string;
  quantity: number;
  plannedStartDate: string;
  plannedEndDate: string;
  status: string;
  progress: number;
  priority: number;
  workCenters: string[];
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#d9d9d9", RELEASED: "#1677ff", IN_PROGRESS: "#52c41a",
  PAUSED: "#faad14", COMPLETED: "#722ed1", CLOSED: "#8c8c8c"
};
const STATUS_LABELS: Record<string, string> = {
  DRAFT: "草稿", RELEASED: "已下发", IN_PROGRESS: "生产中",
  PAUSED: "暂停", COMPLETED: "完成", CLOSED: "关闭"
};

const ROW_HEIGHT = 44;
const LABEL_WIDTH = 180;

export function SchedulePage() {
  const qc = useQueryClient();
  const { data: orders = [] } = useQuery<ScheduleOrder[]>({
    queryKey: ["schedule"],
    queryFn: async () => (await api.get("/production-orders/schedule")).data
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, priority }: { id: string; priority: number }) =>
      api.patch(`/production-orders/${id}/reschedule`, { priority }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedule"] })
  });

  useRealtimeEvent("order:updated", () => {
    qc.invalidateQueries({ queryKey: ["schedule"] });
  });

  if (orders.length === 0) {
    return <Card><Typography.Text type="secondary">暂无工单数据</Typography.Text></Card>;
  }

  const allDates = orders.flatMap(o => [dayjs(o.plannedStartDate), dayjs(o.plannedEndDate)]);
  const minDate = allDates.reduce((a, b) => a.isBefore(b) ? a : b).subtract(2, "day");
  const maxDate = allDates.reduce((a, b) => a.isAfter(b) ? a : b).add(2, "day");
  const totalDays = maxDate.diff(minDate, "day") || 1;
  const chartWidth = Math.max(600, totalDays * 28);

  // Build date tick marks (every 7 days)
  const ticks: dayjs.Dayjs[] = [];
  let tick = minDate.startOf("week");
  while (tick.isBefore(maxDate)) {
    ticks.push(tick);
    tick = tick.add(7, "day");
  }

  function dayOffset(date: string) {
    return dayjs(date).diff(minDate, "day");
  }
  function dayWidth(start: string, end: string) {
    return Math.max(1, dayjs(end).diff(dayjs(start), "day"));
  }

  return (
    <Card title="排程甘特图" styles={{ body: { padding: 0, overflowX: "auto" } }}>
      <div style={{ display: "flex", minWidth: LABEL_WIDTH + chartWidth }}>
        {/* Row labels */}
        <div style={{ width: LABEL_WIDTH, flexShrink: 0, borderRight: "1px solid #f0f0f0" }}>
          <div style={{ height: 32, borderBottom: "1px solid #f0f0f0", background: "#fafafa" }} />
          {orders.map(o => (
            <div key={o.id} style={{ height: ROW_HEIGHT, display: "flex", alignItems: "center", padding: "0 8px", borderBottom: "1px solid #f5f5f5", gap: 4 }}>
              <Typography.Text style={{ fontSize: 12, flex: 1 }} ellipsis={{ tooltip: o.orderNo }}>{o.orderNo}</Typography.Text>
              <Space size={2}>
                <Button size="small" style={{ fontSize: 10, padding: "0 4px", height: 18 }}
                  disabled={o.priority <= 1}
                  onClick={() => rescheduleMutation.mutate({ id: o.id, priority: o.priority - 1 })}>↑</Button>
                <Button size="small" style={{ fontSize: 10, padding: "0 4px", height: 18 }}
                  onClick={() => rescheduleMutation.mutate({ id: o.id, priority: o.priority + 1 })}>↓</Button>
              </Space>
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div style={{ flex: 1, position: "relative" }}>
          {/* Date axis */}
          <div style={{ height: 32, borderBottom: "1px solid #f0f0f0", background: "#fafafa", position: "relative" }}>
            {ticks.map(t => (
              <span key={t.format()} style={{
                position: "absolute",
                left: (dayOffset(t.format("YYYY-MM-DD")) / totalDays) * chartWidth,
                fontSize: 11, color: "#8c8c8c", top: 8, whiteSpace: "nowrap"
              }}>{t.format("MM/DD")}</span>
            ))}
          </div>

          {/* Grid lines */}
          {ticks.map(t => (
            <div key={t.format()} style={{
              position: "absolute",
              left: (dayOffset(t.format("YYYY-MM-DD")) / totalDays) * chartWidth,
              top: 32, bottom: 0,
              borderLeft: "1px dashed #f0f0f0",
              pointerEvents: "none"
            }} />
          ))}

          {/* Today line */}
          <div style={{
            position: "absolute",
            left: (dayOffset(dayjs().format("YYYY-MM-DD")) / totalDays) * chartWidth,
            top: 32, bottom: 0,
            borderLeft: "2px solid #ff4d4f",
            pointerEvents: "none",
            zIndex: 2
          }} />

          {/* Order bars */}
          {orders.map((o, idx) => {
            const left = (dayOffset(o.plannedStartDate) / totalDays) * chartWidth;
            const width = Math.max(8, (dayWidth(o.plannedStartDate, o.plannedEndDate) / totalDays) * chartWidth);
            const progressWidth = width * (o.progress / 100);
            return (
              <div key={o.id} style={{ position: "absolute", top: 32 + idx * ROW_HEIGHT + 8, height: ROW_HEIGHT - 16, left, width }}>
                <Tooltip title={`${o.orderNo} · ${o.productName} · ${STATUS_LABELS[o.status]} · 进度${o.progress}%`}>
                  <div style={{ width: "100%", height: "100%", borderRadius: 4, background: "#e6f4ff", border: `1px solid ${STATUS_COLORS[o.status]}`, position: "relative", overflow: "hidden", cursor: "pointer" }}>
                    {/* Progress fill */}
                    <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: progressWidth, background: STATUS_COLORS[o.status], opacity: 0.35, borderRadius: 4 }} />
                    {width > 60 && (
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", paddingLeft: 6 }}>
                        <Tag color={STATUS_COLORS[o.status]} style={{ fontSize: 10, margin: 0, lineHeight: "16px" }}>{o.orderNo}</Tag>
                      </div>
                    )}
                  </div>
                </Tooltip>
              </div>
            );
          })}

          {/* Row backgrounds */}
          {orders.map((_, idx) => (
            <div key={idx} style={{
              position: "absolute", top: 32 + idx * ROW_HEIGHT, height: ROW_HEIGHT,
              left: 0, right: 0,
              background: idx % 2 === 0 ? "transparent" : "#fafafa",
              pointerEvents: "none"
            }} />
          ))}

          {/* Invisible spacer to set height */}
          <div style={{ height: 32 + orders.length * ROW_HEIGHT, width: chartWidth }} />
        </div>
      </div>

      <div style={{ padding: "8px 16px", borderTop: "1px solid #f0f0f0", fontSize: 12, color: "#8c8c8c" }}>
        共 {orders.length} 条工单 · 红线为今日 · ↑↓ 调整优先级
      </div>
    </Card>
  );
}
