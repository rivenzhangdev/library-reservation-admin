import admin from './module/admin/zh-CN';
import booking from './module/booking/zh-CN';
import common from './module/common/zh-CN';
import credit from './module/credit/zh-CN';
import feedback from './module/feedback/zh-CN';
import floor from './module/floor/zh-CN';
import management from './module/management/zh-CN';
import menu from './module/menu/zh-CN';
import notification from './module/notification/zh-CN';
import phoneChangeRequest from './module/phoneChangeRequest/zh-CN';
import seat from './module/seat/zh-CN';
import studentIdChangeRequest from './module/studentIdChangeRequest/zh-CN';
import zone from './module/zone/zh-CN';
import operationDashboard from './module/operationDashboard/zh-CN';

export default {
  ...booking,
  ...common,
  ...feedback,
  ...credit,
  ...floor,
  ...admin,
  ...management,
  ...notification,
  ...phoneChangeRequest,
  ...studentIdChangeRequest,
  ...seat,
  ...zone,
  ...menu,
  ...operationDashboard,
};
