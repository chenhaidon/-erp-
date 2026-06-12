import { Button, Card, Space, Table } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";

export function IntegrationsPage() {
  const queryClient = useQueryClient();
  const jobsQuery = useQuery({
    queryKey: ["integration-jobs"],
    queryFn: async () => (await api.get("/integrations/jobs")).data
  });
  const mappingsQuery = useQuery({
    queryKey: ["integration-mappings"],
    queryFn: async () => (await api.get("/integrations/mappings")).data
  });

  const triggerMutation = useMutation({
    mutationFn: async (system: string) => api.post(`/integrations/${system}/sync`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["integration-jobs"] })
  });

  return (
    <div className="page-stack">
      <Card title="同步任务" extra={
        <Space>
          <Button onClick={() => triggerMutation.mutate("mes")}>同步 MES</Button>
          <Button onClick={() => triggerMutation.mutate("wms")}>同步 WMS</Button>
        </Space>
      }>
        <Table
          rowKey="id"
          dataSource={jobsQuery.data ?? []}
          columns={[
            { title: "系统", dataIndex: "system" },
            { title: "方向", dataIndex: "direction" },
            { title: "状态", dataIndex: "status" },
            { title: "消息", dataIndex: "message" }
          ]}
        />
      </Card>
      <Card title="字段映射">
        <Table
          rowKey="id"
          dataSource={mappingsQuery.data ?? []}
          columns={[
            { title: "系统", dataIndex: "system" },
            { title: "实体", dataIndex: "entityName" },
            { title: "字段", dataIndex: "fieldName" },
            { title: "来源字段", dataIndex: "sourceField" }
          ]}
        />
      </Card>
    </div>
  );
}
