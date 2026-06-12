import { Button, Card, Form, Input, Space, Table } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../../lib/api";

type AiRecord = {
  key: string;
  type: string;
  prompt: string;
  result: string;
};

export function AiPage() {
  const [records, setRecords] = useState<AiRecord[]>([]);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ endpoint, prompt }: { endpoint: string; prompt: string }) => {
      const response = await api.post(endpoint, { prompt });
      return response.data;
    },
    onSuccess: (data, variables) => {
      setRecords((current) => [
        {
          key: data.id,
          type: variables.endpoint,
          prompt: data.prompt,
          result: data.result
        },
        ...current
      ]);
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    }
  });

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card title="AI 助手">
        <Form
          layout="vertical"
          onFinish={(values: { prompt: string }) => {
            mutation.mutate({ endpoint: "/ai/generate-summary", prompt: values.prompt });
          }}
        >
          <Form.Item label="输入问题或摘要指令" name="prompt" rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder="例如：生成今日经营摘要" />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">生成经营摘要</Button>
            <Button onClick={() => mutation.mutate({ endpoint: "/ai/ask-schedule", prompt: "请给出今日排产建议" })}>排产问答</Button>
            <Button onClick={() => mutation.mutate({ endpoint: "/ai/analyze-root-cause", prompt: "分析当前异常根因" })}>异常分析</Button>
          </Space>
        </Form>
      </Card>
      <Card title="调用记录">
        <Table
          rowKey="key"
          dataSource={records}
          columns={[
            { title: "类型", dataIndex: "type" },
            { title: "问题", dataIndex: "prompt" },
            { title: "结果", dataIndex: "result" }
          ]}
        />
      </Card>
    </Space>
  );
}
