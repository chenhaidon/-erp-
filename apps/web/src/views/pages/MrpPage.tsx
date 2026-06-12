import { Badge, Button, Card, Descriptions, Table, Tag } from "antd";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

type Suggestion = { materialCode: string; suggestedQty: number; unit?: string; reason?: string };

const STATUS_MAP: Record<string, { color: string; text: string }> = {
  COMPLETED: { color: "success", text: "已完成" },
  RUNNING: { color: "processing", text: "运算中" },
  FAILED: { color: "error", text: "失败" },
  PENDING: { color: "default", text: "待运算" },
};

export function MrpPage() {
  const latestQuery = useQuery({
    queryKey: ["mrp-latest"],
    queryFn: async () => {
      const created = await api.post("/mrp/runs");
      return (await api.get(`/mrp/runs/${created.data.id}/result`)).data;
    }
  });

  const rerunMutation = useMutation({
    mutationFn: async () => {
      const created = await api.post("/mrp/runs");
      return (await api.get(`/mrp/runs/${created.data.id}/result`)).data;
    }
  });

  const run = rerunMutation.data ?? latestQuery.data;
  const suggestions: Suggestion[] = run?.summary?.suggestions ?? [];
  const statusInfo = STATUS_MAP[run?.status] ?? { color: "default", text: run?.status ?? "-" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card
        title="MRP 运算"
        extra={
          <Button onClick={() => rerunMutation.mutate()} loading={rerunMutation.isPending}>
            重新运行
          </Button>
        }
      >
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="运算单号">{run?.runNo ?? "-"}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Badge status={statusInfo.color as "success" | "processing" | "error" | "default"} text={statusInfo.text} />
          </Descriptions.Item>
          <Descriptions.Item label="建议采购数" span={1}>{suggestions.length} 项</Descriptions.Item>
          <Descriptions.Item label="运算时间" span={1}>{run?.createdAt ? new Date(run.createdAt).toLocaleString("zh-CN") : "-"}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={`采购建议清单（${suggestions.length} 项）`}>
        <Table
          rowKey="materialCode"
          size="small"
          dataSource={suggestions}
          pagination={suggestions.length > 10 ? { pageSize: 10 } : false}
          locale={{ emptyText: "暂无建议，请先运行 MRP" }}
          columns={[
            {
              title: "物料编码",
              dataIndex: "materialCode",
              render: (v: string) => <Tag color="blue">{v}</Tag>,
            },
            {
              title: "建议采购量",
              dataIndex: "suggestedQty",
              align: "right",
              render: (v: number, r: Suggestion) => (
                <span>
                  <strong style={{ fontSize: 15 }}>{v.toLocaleString()}</strong>
                  {r.unit ? <span style={{ color: "#888", marginLeft: 4 }}>{r.unit}</span> : null}
                </span>
              ),
            },
            {
              title: "建议原因",
              dataIndex: "reason",
              render: (v: string) => v ?? <span style={{ color: "#bbb" }}>安全库存补货</span>,
            },
          ]}
        />
      </Card>
    </div>
  );
}
