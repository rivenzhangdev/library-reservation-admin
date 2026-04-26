import { Result, Button } from 'antd';
import { history } from '@umijs/max';

export default function ForbiddenPage() {
  return (
    <Result
      status="403"
      title="403"
      subTitle="抱歉，当前账号没有访问该页面的权限。"
      extra={
        <Button type="primary" onClick={() => history.push('/')}>
          返回首页
        </Button>
      }
    />
  );
}
