import { Badge, Calendar } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';
import { Eventbase, eventbase_range_contains, settings } from './data_base';

interface CalendarParam {
  date: Date;
  set_date: (date: Date) => void;
  eventbase_list: Eventbase[];
}

function CalendarView({ date, eventbase_list, set_date }: CalendarParam) {

  function renderCell(date: Date) {
    const range_interval = settings.intervals.day; // todo: or use data from event settings
    const day_range_eventbase_list = eventbase_list.filter(eventbase => eventbase_range_contains(eventbase, range_interval, date));

    if (day_range_eventbase_list.length) {
      return <Badge content={day_range_eventbase_list.length} />;
    }

    return null;
  }

  return (
    <>
      <Calendar bordered compact renderCell={renderCell} value={date} onChange={set_date} />
    </>
  )
}

export default CalendarView;
