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
          defaultMessage: 'Access example',
        }),
      }}
    >
      <Access accessible={access.canSeeAdmin}>
        <Button>
          {intl.formatMessage({
            id: 'access.onlyAdminButton',
            defaultMessage: 'Only Admin can see this button',
          })}
        </Button>
      </Access>
    </PageContainer>
  );
};

export default AccessPage;
