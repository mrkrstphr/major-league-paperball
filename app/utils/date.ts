import { format } from 'date-fns';

export const formatDateTime = (date: string | Date) => {
  const doubleDate = new Date(date);

  switch (process.env.DATE_FORMAT) {
    case 'american':
      return format(doubleDate, 'L/d h:mm a');

    case 'world':
      return format(doubleDate, 'd/L H:mm');
  }

  return doubleDate.toLocaleString();
};

export const formatTime = (date: string | Date) => {
  const doubleDate = new Date(date);

  switch (process.env.DATE_FORMAT) {
    case 'american':
      return format(doubleDate, 'h:mm a');

    case 'world':
      return format(doubleDate, 'H:mm');
  }

  return doubleDate.toLocaleTimeString();
};
