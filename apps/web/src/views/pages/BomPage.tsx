import { Card, Collapse, List } from "antd";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

export function BomPage() {
  const { data } = useQuery({
    queryKey: ["boms"],
    queryFn: async () => (await api.get("/boms")).data
  });

  return (
    <Card title="BOM 管理">
      <Collapse
        items={(data ?? []).map((item: { id: string; code: string; materialCode: string; version: string; items: Array<{ materialCode: string; quantity: number; lossRate: number }> }) => ({
          key: item.id,
          label: `${item.code} · ${item.materialCode} · ${item.version}`,
          children: (
            <List
              dataSource={item.items}
              renderItem={(child) => (
                <List.Item>{`${child.materialCode} / 数量 ${child.quantity} / 损耗 ${child.lossRate}`}</List.Item>
              )}
            />
          )
        }))}
      />
    </Card>
  );
}
