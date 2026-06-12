import type { CurrentUserProfile } from "@smart-erp/shared";
import { Button, Card, Form, Input, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useSessionStore } from "../state/session-store";

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: CurrentUserProfile;
};

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useSessionStore((state) => state.setSession);

  return (
    <div className="login-page">
      <Card className="login-card">
        <Typography.Text type="secondary">智能制造 ERP</Typography.Text>
        <Typography.Title level={2}>系统登录</Typography.Title>
        <Form
          layout="vertical"
          initialValues={{ username: "admin", password: "Admin@123" }}
          onFinish={async (values: { username: string; password: string }) => {
            const response = await api.post<LoginResponse>("/auth/login", values);
            setSession({
              accessToken: response.data.accessToken,
              refreshToken: response.data.refreshToken,
              factoryId: response.data.user.defaultFactoryId,
              username: response.data.user.username,
              displayName: response.data.user.displayName,
              permissions: response.data.user.permissions,
              roles: response.data.user.roles
            });
            navigate("/");
          }}
        >
          <Form.Item label="用户名" name="username" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            登录
          </Button>
        </Form>
      </Card>
    </div>
  );
}
