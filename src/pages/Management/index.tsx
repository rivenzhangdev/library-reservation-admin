import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Tabs } from 'antd';
import React from 'react';
import FloorManagement from '../Floor';
import ZoneManagement from '../Zone';

const Management: React.FC = () => {
  const intl = useIntl();

  return (
    <PageContainer
      title={intl.formatMessage({
        id: 'menu.management',
        defaultMessage: 'Management',
      })}
    >
      <Tabs defaultActiveKey="1">
        <Tabs.TabPane
          tab={intl.formatMessage({
            id: 'floor.title',
            defaultMessage: 'Floor Management',
          })}
          key="1"
        >
          <FloorManagement />
        </Tabs.TabPane>
        <Tabs.TabPane
          tab={intl.formatMessage({
            id: 'zone.title',
            defaultMessage: 'Zone Management',
          })}
          key="2"
        >
          <ZoneManagement />
        </Tabs.TabPane>
      </Tabs>
    </PageContainer>
  );
};

export default Management;
