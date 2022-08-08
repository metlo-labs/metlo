import { DateTime } from "luxon"

export const getDateTimeString = (date: Date) => {
  if (date) {
    return DateTime.fromISO(date.toString()).toLocaleString(DateTime.DATETIME_MED);
  }
  return null;
}
