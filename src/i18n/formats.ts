export const formats = {
  dateTime: {
    eventDate: {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "Europe/Lisbon",
    },
    eventTime: {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: "Europe/Lisbon",
    },
  },
  number: {
    currency: {
      style: "currency",
      currency: "EUR",
    },
  },
} as const;
