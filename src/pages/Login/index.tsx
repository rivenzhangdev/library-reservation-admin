import { login } from '@/services/library/user';
import { history, SelectLang, useIntl, useModel } from '@umijs/max';
import { Button, Card, Form, Input, message } from 'antd';
import React from 'react';
import { flushSync } from 'react-dom';
import './index.less';

const LoginPage: React.FC = () => {
  const [form] = Form.useForm();
  const initialStateModel = (useModel as any)('@@initialState');
  const setInitialState = initialStateModel?.setInitialState;

  const globalModel = (useModel as any)('global');
  const setCurrentUser = globalModel?.setCurrentUser;
  const setToken = globalModel?.setToken;

  const intl = useIntl();

  const onFinish = async (values: any) => {
    try {
      const res: any = await login(values);
      if (res && res.success && res.data) {
        const { token, user } = res.data;
        try {
          localStorage.setItem('token', token);
          localStorage.setItem('currentUser', JSON.stringify(user));
        } catch (e) {
          // ignore
        }
        try {
          if (setCurrentUser) setCurrentUser(user);
          if (setToken) setToken(token);
        } catch (e) {
          // ignore
        }
        try {
          if (setInitialState) {
            flushSync(() => {
              setInitialState((s: any) => ({
                ...s,
                name:
                  user?.name ||
                  intl.formatMessage({
                    id: 'right.guest',
                    defaultMessage: intl.formatMessage({
                      id: 'right.guest',
                      defaultMessage: '游客',
                    }),
                  }),
                currentUser: user,
                token,
              }));
            });
            message.success(
              intl.formatMessage({
                id: 'login.submit',
                defaultMessage: intl.formatMessage({
                  id: 'login.submit',
                  defaultMessage: '登录',
                }),
              }) + '成功',
            );
            history.replace('/');
            return;
          }
        } catch (e) {
          // fallback
        }
        message.success(
          intl.formatMessage({
            id: 'login.submit',
            defaultMessage: intl.formatMessage({
              id: 'login.submit',
              defaultMessage: '登录',
            }),
          }) + '成功',
        );
        history.push('/');
        return;
      }
      message.error(
        res?.message ||
          intl.formatMessage({
            id: 'login.submit',
            defaultMessage: intl.formatMessage({
              id: 'login.submit',
              defaultMessage: '登录',
            }),
          }) + '失败',
      );
    } catch (e: any) {
      message.error(
        e?.message ||
          intl.formatMessage({
            id: 'login.submit',
            defaultMessage: intl.formatMessage({
              id: 'login.submit',
              defaultMessage: '登录',
            }),
          }) + '接口异常',
      );
    }
  };

  return (
    <div className="login-page">
      <div style={{ position: 'absolute', top: 24, right: 24 }}>
        <SelectLang />
      </div>
      <Card className="login-card" variant="outlined">
        <div className="login-header">
          {intl.formatMessage({
            id: 'app.title',
            defaultMessage: intl.formatMessage({
              id: 'app.title',
              defaultMessage: '图书馆管理后台',
            }),
          })}
        </div>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ username: 'test', password: 'test' }}
        >
          <Form.Item
            name="username"
            label={intl.formatMessage({
              id: 'login.username',
              defaultMessage: intl.formatMessage({
                id: 'login.username',
                defaultMessage: '用户名',
              }),
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'login.username',
                  defaultMessage: intl.formatMessage({
                    id: 'login.username',
                    defaultMessage: '用户名',
                  }),
                }),
              },
            ]}
          >
            <Input
              placeholder={intl.formatMessage({
                id: 'login.username',
                defaultMessage: intl.formatMessage({
                  id: 'login.username',
                  defaultMessage: '用户名',
                }),
              })}
            />
          </Form.Item>
          <Form.Item
            name="password"
            label={intl.formatMessage({
              id: 'login.password',
              defaultMessage: intl.formatMessage({
                id: 'login.password',
                defaultMessage: '密码',
              }),
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'login.password',
                  defaultMessage: intl.formatMessage({
                    id: 'login.password',
                    defaultMessage: '密码',
                  }),
                }),
              },
            ]}
          >
            <Input.Password
              placeholder={intl.formatMessage({
                id: 'login.password',
                defaultMessage: intl.formatMessage({
                  id: 'login.password',
                  defaultMessage: '密码',
                }),
              })}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {intl.formatMessage({
                id: 'login.submit',
                defaultMessage: intl.formatMessage({
                  id: 'login.submit',
                  defaultMessage: '登录',
                }),
              })}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;
