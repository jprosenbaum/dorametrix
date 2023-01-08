import { getCurrentDate, getDateBefore } from './date';
import { getMillisecondsForDays } from './getMillisecondsForDays';

import { InvalidIsoDateConversionError } from '../../application/errors/InvalidIsoDateConversionError';

/**
 * @description Calculates `from` and `to` timestamps for a provided period in days.
 *
 * Using `lastNumDays` means getting specified range excluding current day.
 */
export function getTimestampsForPeriod(lastNumDays: number, offsetInHours = 0) {
  const toTime = getTimestampForInputDate(getDateBefore(true), offsetInHours, true);
  const fromTime = new Date(
    parseInt(`${toTime}999`) - getMillisecondsForDays(lastNumDays) + 1
  ).getTime();

  return {
    from: `${fromTime}`.substring(0, 10),
    to: `${toTime}`.substring(0, 10)
  };
}

/**
 * @description Gets a corresponding Unix timestamp for a `YYYYMMDD` date.
 *
 * @param date Date in YYYYMMDD format
 * @param offsetInHours Optional timezone offset in hours, using the format `0` (UTC; default), `-4` (behind UTC), or `7` (before UTC)
 *
 * @example `1672531200`
 */
export function getTimestampForInputDate(
  date: string,
  offsetInHours = 0,
  lastPossibleTime = false
) {
  const formatted = convertToIsoDate(date);
  const timestamp = getTimestampForISODate(formatted, offsetInHours, lastPossibleTime);

  return `${timestamp}`;
}

/**
 * @description Converts a `YYYYMMDD` date string to ISO format.
 * @example `20230101`
 */
function convertToIsoDate(input: string) {
  if (!input || input.length !== 8) throw new InvalidIsoDateConversionError();

  const year = input.substring(0, 4);
  const month = input.substring(4, 6);
  const day = input.substring(6, 8);

  return `${year}-${month}-${day}`;
}

/**
 * @description Retrieve timestamp for an ISO date such as `2023-01-01`.
 *
 * @param formattedDate Date in the ISO format of `2023-01-01`
 * @param offsetInHours Optional timezone offset in hours, using the format `0` (UTC; default), `-4` (behind UTC), or `7` (before UTC)
 *
 * @example `1672531200`
 */
function getTimestampForISODate(
  formattedDate: string,
  offsetInHours = 0,
  lastPossibleTime = false
) {
  const date = new Date(
    createTimezoneConvertedDateString(formattedDate, offsetInHours, lastPossibleTime)
  );
  return Math.floor(date.getTime() / 1000);
}

/**
 * @description Returns a long timezone-converted date string from a formatted date such as `2023-01-01`.
 * @example `2023-01-01T00:00:00.000+05:00`
 */
function createTimezoneConvertedDateString(
  formattedDate: string,
  offsetInHours: number,
  lastPossibleTime = false
) {
  /**
   * Note that this is "flipped" and works contrary to how we normally
   * think about timezones. We typically think of e.g. New York as
   * several hours "behind" (minus, -) London/GMT/UTC/Zulu time.
   *
   * However, for some unknown reason when adding the offset we get
   * precisely the reverse results: That's why we do the flip of +/- here.
   */
  const offsetMarker = offsetInHours.toString().includes('-') ? '+' : '-';
  const numericOffset = offsetInHours.toString().replace('-', '');
  const leadingZero = numericOffset.length === 1 ? '0' : '';
  const time = lastPossibleTime ? 'T23:59:59.999' : 'T00:00:00.000';

  return `${formattedDate}${time}${offsetMarker}${leadingZero}${numericOffset}:00`;
}

/**
 * @description Get maximum historical/past timestamp at midnight X number of days ago.
 */
export function getMaxTimestampFromDate(maxDateRange: number, offset: number) {
  const date = new Date(getCurrentDate());
  date.setUTCDate(date.getUTCDate() - maxDateRange);
  return getTimestampForInputDate(date.toISOString().substring(0, 10).replaceAll('-', ''), offset);
}

/**
 * @description Get the difference in seconds between two moments in time (i.e. Unix timestamps).
 */
export const getDiffInSeconds = (earlierTime: number, laterTime: number): number =>
  Math.floor((laterTime - earlierTime) / 1000);
