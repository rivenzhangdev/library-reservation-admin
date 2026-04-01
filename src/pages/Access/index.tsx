import { PageContainer } from '@ant-design/pro-components';
import { Access, useAccess, useIntl } from '@umijs/max';
import { Button } from 'antd';

const AccessPage: React.FC = () => {
  const intl = useIntl();

  const access = useAccess();
  return (
    <PageContainer
      ghost
      header={{
        title: intl.formatMessage({
          id: 'access.title',
          defaultMessage: '权限示例',
        }),
      }}
    >
      <Access accessible={access.canSeeAdmin}>
        <Button>
          {intl.formatMessage({
            id: 'access.onlyAdminButton',
            defaultMessage: '只有 Admin 可以看到这个按钮',
          })}
        </Button>
      </Access>
    </PageContainer>
  );
};

export default AccessPage;
