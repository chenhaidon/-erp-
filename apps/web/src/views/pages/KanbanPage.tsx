import { Badge, Card, Col, Progress, Row, Tag, Typography } from "antd";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useRealtimeEvent } from "../../hooks/use-realtime";

type OrderItem = {
  id: string;
  orderNo: string;
  product: { name: string; code: string };
  quantity: number;
  progress: number;
  priority: number;
  status: string;
  plannedEndDate: string;
};

type KanbanData = Record<string, OrderItem[]>;

const COLUMNS = [
  { key: "DRAFT", label: "草稿", color: "default" },
  { key: "RELEASED", label: "已下发", color: "blue" },
  { key: "IN_PROGRESS", label: "生产中", color: "green" },
  { key: "COMPLETED", label: "已完成", color: "purple" }
] as const;

const PRIORITY_COLORS = ["", "red", "orange", "blue", "cyan", "default"];

export function KanbanPage() {
  const qc = useQueryClient();
  const { data } = useQuery<KanbanData>({
    queryKey: ["kanban"],
    queryFn: async () => (await api.get("/production-orders/kanban")).data
  });

  useRealtimeEvent("order:updated", () => {
    qc.invalidateQueries({ queryKey: ["kanban"] });
  });

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 16 }}>生产看板</Typography.Title>
      <Row gutter={12}>
        {COLUMNS.map(col => {
          const orders = data?.[col.key] ?? [];
          return (
            <Col key={col.key} span={6}>
              <Card
                title={
                  <span>
                    <Badge count={orders.length} color={col.color === "default" ? "gray" : col.color} style={{ marginRight: 8 }} />
                    {col.label}
                  </span>
                }
                size="small"
                style={{ minHeight: 400, background: "#fafafa" }}
                styles={{ body: { padding: 8 } }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {orders.map(order => (
                    <Card key={order.id} size="small" style={{ borderLeft: `3px solid ${col.color === "default" ? "#d9d9d9" : col.color === "blue" ? "#1677ff" : col.color === "green" ? "#52c41a" : "#722ed1"}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <Typography.Text strong style={{ fontSize: 12 }}>{order.orderNo}</Typography.Text>
                        <Tag color={PRIORITY_COLORS[order.priority] as string} style={{ fontSize: 10, margin: 0 }}>P{order.priority}</Tag>
                      </div>
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>{order.product?.name}</Typography.Text>
                      <div style={{ marginTop: 6 }}>
                        <Progress percent={Math.round(order.progress)} size="small" strokeColor={order.progress >= 100 ? "#52c41a" : "#1677ff"} />
                      </div>
                      <Typography.Text type="secondary" style={{ fontSize: 10 }}>
                        数量: {order.quantity} · 计划完成: {order.plannedEndDate ? new Date(order.plannedEndDate).toLocaleDateString("zh-CN") : "-"}
                      </Typography.Text>
                    </Card>
                  ))}
                  {orders.length === 0 && (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "#bbb" }}>暂无工单</div>
                  )}
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}
