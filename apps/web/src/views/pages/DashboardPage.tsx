import { Card, Col, List, Row, Statistic, Table, Tag } from "antd";
import { useQuery } from "@tanstack/react-query";
import type { DashboardSummary } from "@smart-erp/shared";
import { api } from "../../lib/api";

export function DashboardPage() {
  const summaryQuery = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => (await api.get("/dashboard/summary")).data as DashboardSummary
  });
  const ordersQuery = useQuery({
    queryKey: ["production-orders"],
    queryFn: async () => (await api.get("/production-orders")).data
  });
  const equipmentQuery = useQuery({
    queryKey: ["equipment"],
    queryFn: async () => (await api.get("/equipment")).data
  });

  const summary = summaryQuery.data;

  return (
    <div className="page-stack">
      <Row gutter={[16, 16]}>
        <Col span={6}><Card><Statistic title="交付达成率" value={summary?.deliveryRate ?? 0} suffix="%" /></Card></Col>
        <Col span={6}><Card><Statistic title="设备 OEE" value={summary?.equipmentOee ?? 0} suffix="%" /></Card></Col>
        <Col span={6}><Card><Statistic title="风险工单" value={summary?.riskOrders ?? 0} /></Card></Col>
        <Col span={6}><Card><Statistic title="待检数量" value={summary?.pendingInspections ?? 0} /></Card></Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col span={8}><Card><Statistic title="待采购审批" value={summary?.pendingPurchaseApprovals ?? 0} /></Card></Col>
        <Col span={8}><Card><Statistic title="质量异常" value={summary?.qualityAlerts ?? 0} /></Card></Col>
        <Col span={8}><Card><Statistic title="设备异常" value={summary?.equipmentAlerts ?? 0} /></Card></Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col span={14}>
          <Card title="工单状态">
            <Table
              rowKey="id"
              pagination={false}
              dataSource={ordersQuery.data ?? []}
              columns={[
                { title: "工单", dataIndex: "orderNo" },
                { title: "产品", dataIndex: "productName" },
                { title: "数量", dataIndex: "quantity" },
                { title: "进度", dataIndex: "progress", render: (value: number) => `${value}%` },
                { title: "状态", dataIndex: "status", render: (value: string) => <Tag color="cyan">{value}</Tag> }
              ]}
            />
          </Card>
        </Col>
        <Col span={10}>
          <Card title="设备关注">
            <List
              dataSource={equipmentQuery.data ?? []}
              renderItem={(item: { id: string; code: string; name: string; healthScore: number; status: string }) => (
                <List.Item key={item.id}>
                  <List.Item.Meta
                    title={`${item.code} · ${item.name}`}
                    description={`健康分 ${item.healthScore} / 状态 ${item.status}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
