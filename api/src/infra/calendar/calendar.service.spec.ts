import { CalendarService } from './calendar.service';

describe('CalendarService', () => {
  const holidaysService = {
    isHoliday: jest.fn().mockResolvedValue(false),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses previous business day when due date falls on a non-business day and reminder is on the due date', async () => {
    const service = new CalendarService(holidaysService);
    const previousBusinessDay = new Date('2026-05-08T08:00:00.000Z');

    jest.spyOn(service, 'isBusinessDay').mockResolvedValue(false);
    jest.spyOn(service, 'previousBusinessDay').mockResolvedValue(previousBusinessDay);

    await expect(service.notificationDateForDueDate(new Date('2026-05-10T12:00:00.000Z'), 0)).resolves.toBe(
      previousBusinessDay,
    );
  });

  it('keeps the reminder date when it is already a business day', async () => {
    const service = new CalendarService(holidaysService);

    jest.spyOn(service, 'isBusinessDay').mockResolvedValue(true);
    const previousBusinessDaySpy = jest.spyOn(service, 'previousBusinessDay');

    const result = await service.notificationDateForDueDate(new Date('2026-05-10T12:00:00.000Z'), 3);

    expect(previousBusinessDaySpy).not.toHaveBeenCalled();
    expect(result).toBeInstanceOf(Date);
  });
});
