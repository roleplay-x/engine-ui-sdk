import { Toast } from '../../screens/toaster/screen';

import { ScreenType } from './screen-type';

export type ScreenNotification = {
  screen: ScreenType.Toaster;
  type: 'toast';
  data: Toast;
};
