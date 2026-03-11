const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export class DateHelper {
  static setUtcTime(date: Date, hours: number, minutes = 0, seconds = 0, milliseconds = 0): Date {
    const clonedDate = new Date(date.getTime());
    clonedDate.setUTCHours(hours, minutes, seconds, milliseconds);
    return clonedDate;
  }

  static setUtcDayOfWeek(date: Date, targetDay: number, hours: number, minutes = 0, seconds = 0, ms = 0): Date {
    const clonedDate = new Date(date.getTime());
    const diff = targetDay - clonedDate.getUTCDay();
    clonedDate.setUTCDate(clonedDate.getUTCDate() + diff);
    clonedDate.setUTCHours(hours, minutes, seconds, ms);
    return clonedDate;
  }

  static addDays(date: Date, days: number): Date {
    const clonedDate = new Date(date.getTime());
    clonedDate.setUTCDate(clonedDate.getUTCDate() + days);
    return clonedDate;
  }

  static addWeeks(date: Date, weeks: number): Date {
    return DateHelper.addDays(date, weeks * 7);
  }

  static addMilliseconds(date: Date, milliseconds: number): Date {
    return new Date(date.getTime() + milliseconds);
  }

  static subtractMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() - minutes * 60 * 1000);
  }

  static formatLog(date: Date): string {
    const pad = (value: number, length = 2) => value.toString().padStart(length, "0");

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    const milliseconds = pad(date.getMilliseconds(), 3);

    const offset = -date.getTimezoneOffset();
    const sign = offset >= 0 ? "+" : "-";
    const absOffset = Math.abs(offset);
    const offsetHours = pad(Math.floor(absOffset / 60));
    const offsetMinutes = pad(absOffset % 60);

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds} ${sign}${offsetHours}${offsetMinutes}`;
  }

  static formatOrdinalDate(date: Date): string {
    const day = date.getUTCDate();
    const suffix = DateHelper.getOrdinalSuffix(day);
    return `${day}${suffix} ${MONTHS_SHORT[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
  }

  static formatMediumDate(date: Date): string {
    return `${MONTHS_SHORT[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
  }

  private static getOrdinalSuffix(day: number): string {
    const suffixes = ["th", "st", "nd", "rd"];
    const remainder = day % 100;
    return suffixes[(remainder - 20) % 10] || suffixes[remainder] || suffixes[0];
  }

  static toEpochSeconds(date: Date): number {
    return Math.floor(date.getTime() / 1000);
  }
}
