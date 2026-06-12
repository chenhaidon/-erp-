import { Card, Collapse, List } from "antd";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

export function RoutingsPage() {
  const { data } = useQuery({
    queryKey: ["routings"],
    queryFn: async () => (await api.get("/routings")).data
  });

  return (
    <Card title="工艺路线">
      <Collapse
        items={(data ?? []).map((item: { id: string; code: string; materialCode: string; version: string; operations: Array<{ sequence: number; operationName: string; workCenterCode: string; standardMinutes: number }> }) => ({
          key: item.id,
          label: `${item.code} · ${item.materialCode} · ${item.version}`,
          children: (
            <List
              dataSource={item.operations}
              renderItem={(operation) => (
                <List.Item>{`${operation.sequence} / ${operation.operationName} / ${operation.workCenterCode} / ${operation.standardMinutes} 分钟`}</List.Item>
              )}
            />
          )
        }))}
      />
    </Card>
  );
}
