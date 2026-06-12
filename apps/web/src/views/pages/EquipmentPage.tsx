import { Card, Col, Row, Table } from "antd";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

export function EquipmentPage() {
  const equipmentQuery = useQuery({
    queryKey: ["equipment"],
    queryFn: async () => (await api.get("/equipment")).data
  });
  const maintenanceQuery = useQuery({
    queryKey: ["maintenance-orders"],
    queryFn: async () => (await api.get("/maintenance-orders")).data
  });

  return (
    <Row gutter={[16, 16]}>
      <Col span={14}>
        <Card title="设备台账">
          <Table
            rowKey="id"
            dataSource={equipmentQuery.data ?? []}
            columns={[
              { title: "编码", dataIndex: "code" },
              { title: "名称", dataIndex: "name" },
              { title: "健康分", dataIndex: "healthScore" },
              { title: "OEE", dataIndex: "oee" },
              { title: "状态", dataIndex: "status" }
            ]}
          />
        </Card>
      </Col>
      <Col span={10}>
        <Card title="维护工单">
          <Table
            rowKey="id"
            pagination={false}
            dataSource={maintenanceQuery.data ?? []}
            columns={[
              { title: "工单", dataIndex: "orderNo" },
              { title: "设备", dataIndex: "equipmentCode" },
              { title: "状态", dataIndex: "status" }
            ]}
          />
        </Card>
      </Col>
    </Row>
  );
}
