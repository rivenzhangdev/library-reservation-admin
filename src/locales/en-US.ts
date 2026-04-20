import admin from './module/admin/en-US';
import booking from './module/booking/en-US';
import common from './module/common/en-US';
import credit from './module/credit/en-US';
import feedback from './module/feedback/en-US';
import floor from './module/floor/en-US';
import management from './module/management/en-US';
import menu from './module/menu/en-US';
import notification from './module/notification/en-US';
import phoneChangeRequest from './module/phoneChangeRequest/en-US';
import seat from './module/seat/en-US';
import studentIdChangeRequest from './module/studentIdChangeRequest/en-US';
import zone from './module/zone/en-US';
import operationDashboard from './module/operationDashboard/en-US';

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
