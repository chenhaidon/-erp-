import { Button, Card, Col, DatePicker, Row, Statistic, Table } from "antd";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import dayjs from "dayjs";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../../lib/api";

const DEFAULT_START = dayjs().subtract(90, "day").format("YYYY-MM-DD");
const DEFAULT_END = dayjs().format("YYYY-MM-DD");

export function ReportsPage() {
  const [range, setRange] = useState<[string, string]>([DEFAULT_START, DEFAULT_END]);
  const [start, end] = range;

  const prodQuery = useQuery({
    queryKey: ["reports-production", start, end],
    queryFn: async () => (await api.get("/reports/production-summary", { params: { startDate: start, endDate: end } })).data as Array<{ week: string; completed: number; scrapped: number }>
  });
  const qualityQuery = useQuery({
    queryKey: ["reports-quality", start, end],
    queryFn: async () => (await api.get("/reports/quality-trend", { params: { startDate: start, endDate: end } })).data as Array<{ week: string; passRate: number; total: number }>
  });
  const inventoryQuery = useQuery({
    queryKey: ["reports-inventory"],
    queryFn: async () => (await api.get("/reports/inventory-snapshot")).data as Array<{ materialCode: string; materialName: string; warehouseName: string; onHand: number; reserved: number; inTransit: number }>
  });
  const purchaseQuery = useQuery({
    queryKey: ["reports-purchase"],
    queryFn: async () => (await api.get("/reports/purchase-summary")).data as { total: number; onTime: number; onTimeRate: number }
  });

  function handleExport() {
    const url = `${(api.defaults.baseURL ?? "")}/reports/export?startDate=${start}&endDate=${end}`;
    const token = localStorage.getItem("smart-erp-session")
      ? JSON.parse(localStorage.getItem("smart-erp-session")!).accessToken
      : "";
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `erp-report-${start}-${end}.xlsx`;
        a.click();
        URL.revokeObjectURL(a.href);
      });
  }

  const totalCompleted = (prodQuery.data ?? []).reduce((s, r) => s + r.completed, 0);
  const latestPassRate = (qualityQuery.data ?? []).at(-1)?.passRate ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span>日期范围：</span>
          <DatePicker.RangePicker
            value={[dayjs(start), dayjs(end)]}
            onChange={(dates) => {
              if (dates?.[0] && dates?.[1]) {
                setRange([dates[0].format("YYYY-MM-DD"), dates[1].format("YYYY-MM-DD")]);
              }
            }}
          />
          <Button type="primary" onClick={handleExport}>导出 Excel</Button>
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        <Col span={6}><Card><Statistic title="期间完工数量" value={totalCompleted} /></Card></Col>
        <Col span={6}><Card><Statistic title="采购准时到货率" value={purchaseQuery.data?.onTimeRate ?? 0} suffix="%" /></Card></Col>
        <Col span={6}><Card><Statistic title="质量一次通过率" value={latestPassRate} suffix="%" /></Card></Col>
        <Col span={6}><Card><Statistic title="库存品目数" value={inventoryQuery.data?.length ?? 0} /></Card></Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="生产完工趋势">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={prodQuery.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="completed" name="完工" stroke="#1677ff" dot={false} />
                <Line type="monotone" dataKey="scrapped" name="报废" stroke="#ff4d4f" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="质量合格率趋势">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={qualityQuery.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} unit="%" />
                <Tooltip formatter={(v) => `${Number(v ?? 0)}%`} />
                <Legend />
                <Line type="monotone" dataKey="passRate" name="合格率" stroke="#52c41a" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Card title="库存余额分布">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={(inventoryQuery.data ?? []).slice(0, 20)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="materialCode" tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="onHand" name="在手" fill="#1677ff" />
            <Bar dataKey="reserved" name="预留" fill="#faad14" />
            <Bar dataKey="inTransit" name="在途" fill="#52c41a" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="库存明细">
        <Table rowKey="materialCode" size="small" pagination={{ pageSize: 10 }}
          dataSource={inventoryQuery.data ?? []}
          columns={[
            { title: "物料编码", dataIndex: "materialCode" },
            { title: "物料名称", dataIndex: "materialName" },
            { title: "仓库", dataIndex: "warehouseName" },
            { title: "在手数量", dataIndex: "onHand" },
            { title: "预留数量", dataIndex: "reserved" },
            { title: "在途数量", dataIndex: "inTransit" }
          ]}
        />
      </Card>
    </div>
  );
}
