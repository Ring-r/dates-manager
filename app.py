from datetime import date
from datetime import timedelta
import datetime
from pathlib import Path
import sys
from uuid import UUID
from uuid import uuid1

import icalendar
from icalendar import Alarm
from icalendar import Calendar
from pydantic import BaseModel

DEFAULT_DATA_FILE_PATH = "data.json"
DEFAULT_ICS_FILE_PATH = "dates.ics"


class DateItem(BaseModel):
    uid: UUID
    date: date
    event_template_uid: UUID

class EventTemplate(BaseModel):
    uid: UUID
    summary: str

class EventWithAlarmTemplate(EventTemplate):
    alarm_action: str = "DISPLAY"
    alarm_trigger: timedelta = timedelta(0)
    alarm_description: str | None = None

class Data(BaseModel):
    date_item_s: list[DateItem] = []
    event_template_s: list[EventTemplate | EventWithAlarmTemplate] = []

def _default_data() -> Data:
    data = Data()
    data.event_template_s = [
        EventTemplate(
            uid=uuid1(),
            summary="event",
        ),
        EventWithAlarmTemplate(
            uid=uuid1(),
            summary="event with alarm",
            alarm_trigger=timedelta(hours=-24),
            alarm_description="Reminder: Event in 24 hours",
        ),
    ]
    data.date_item_s = [
        DateItem(
            uid=uuid1(),
            date=datetime.datetime.now().date(),
            event_template_uid=data.event_template_s[0].uid,
        ),
    ]
    return data

def _init_data(data_path: Path) -> Data:
    if not data_path.exists():
        _save_data(data_path, _default_data())

    return _load_data(data_path)

def _load_data(data_path: Path) -> Data:
    with data_path.open() as data_file:
        return Data.model_validate_json(data_file.read())

def _save_data(data_path: Path, data: Data) -> None:
    with data_path.open("w") as data_file:
        data_file.write(data.model_dump_json(indent=2))

def _get_date_item_by_uid(data: Data, uid: UUID) -> DateItem | None:
    return next((x for x in data.date_item_s if x.uid == uid), None)

def _get_event_template_by_uid(data: Data, uid: UUID) -> EventTemplate | EventWithAlarmTemplate | None:
    return next((x for x in data.event_template_s if x.uid == uid), None)

def _save_calendar(ics_path: Path, calendar: Calendar) -> None:
    with ics_path.open("wb") as ics_file:
        ics_file.write(calendar.to_ical())

def _main(data_path: Path, ics_path: Path) -> None:
    data = _init_data(data_path)

    calendar = Calendar()

    for date_item in data.date_item_s:
        event_template: EventTemplate | EventWithAlarmTemplate | None = _get_event_template_by_uid(data, date_item.event_template_uid)
        if event_template is None:
            # TODO: show information about wrong event_template_uid.
            continue

        event = icalendar.Event()
        event["uid"] = date_item.uid
        event["SUMMARY"] = event_template.summary.format(date_item)
        formated_date = date_item.date.strftime("%Y%m%dT%H%M%S")
        event["dtstart"] = formated_date
        event["dtsend"] = formated_date
        event.add("rrule", {"freq": "yearly"})

        if isinstance(event_template, EventWithAlarmTemplate):
            alarm = Alarm()
            alarm.add("action", event_template.alarm_action)
            alarm.add("trigger", event_template.alarm_trigger)
            if event_template.alarm_description is not None:
                alarm.add("description", event_template.alarm_description.format(date_item))
            event.add_component(alarm)

        calendar.add_component(event)

    _save_calendar(ics_path, calendar)


def _get_event_template_s(data_path: Path) -> None:
    data = _init_data(data_path)
    print("uid | summary")
    for event_template in data.event_template_s:
        print(f"{event_template.uid} | {event_template.summary}")

    print("Done!")

def _get_event_template(data_path: Path) -> None:
    uid = UUID(input("event template uid: "))

    data = _init_data(data_path)
    event_template = _get_event_template_by_uid(data, uid)
    if event_template is not None:
        print(f"uid: {event_template.uid}")
        print(f"summary: {event_template.summary}")
        if isinstance(event_template, EventWithAlarmTemplate):
            print(f"alarm_action: {event_template.alarm_action}")
            print(f"alarm_trigger: {event_template.alarm_trigger}")
            print(f"alarm_description: {event_template.alarm_description}")

    print("Done!")


def _add_data_item(data_path: Path) -> None:
    date_ = date.fromisoformat(input("date: "))
    event_template_uid = UUID(input("event template uid: "))

    data = _init_data(data_path)
    data.date_item_s.append(
        DateItem(uid=uuid1(), date=date_, event_template_uid=event_template_uid),
    )
    _save_data(data_path, data)

    print("Done!")

def _del_date_item(data_path: Path) -> None:
    uid = UUID(input("date item uid: "))

    data = _init_data(data_path)
    date_item: DateItem | None = _get_date_item_by_uid(data, uid)
    if date_item is not None:
        data.date_item_s.remove(date_item)
        _save_data(data_path, data)

    print("Done!")

def _get_date_item_s_by_date(data_path: Path) -> None:
    date_ = date.fromisoformat(input("date: "))

    data = _init_data(data_path)
    print("uid | event_template_uid | date")
    for date_item in data.date_item_s:
        if date_item.date == date_:
            print(f"{date_item.uid} | {date_item.event_template_uid} | {date_item.date}")

    print("Done!")

def _get_date_item_s_by_event_template_uid(data_path: Path) -> None:
    event_template_uid = UUID(input("event template uid: "))

    data = _init_data(data_path)
    print("uid | event_template_uid | date")
    for date_item in data.date_item_s:
        if date_item.event_template_uid == event_template_uid:
            print(f"{date_item.uid} | {date_item.event_template_uid} | {date_item.date}")

    print("Done!")

def _set_date_item(data_path: Path) -> None:
    uid = UUID(input("date item uid: "))
    event_template_uid = UUID(input("event template uid: "))

    data = _init_data(data_path)
    date_item: DateItem | None = _get_date_item_by_uid(data, uid)
    if date_item is not None:
        date_item.event_template_uid = event_template_uid
        _save_data(data_path, data)

    print("Done!")


if __name__ == "__main__":
    data_path = Path(DEFAULT_DATA_FILE_PATH)
    ics_path = Path(DEFAULT_ICS_FILE_PATH)

    if len(sys.argv) == 1:
        _main(data_path, ics_path)
        exit()

    if sys.argv[1] == "get-template-s":
        _get_event_template_s(data_path)

    if sys.argv[1] == "add-date":
        _add_data_item(data_path)

    if sys.argv[1] == "get-date-s":
        _get_date_item_s_by_date(data_path)

    if sys.argv[1] == "get-date--s":
        _get_date_item_s_by_event_template_uid(data_path)

    if sys.argv[1] == "del-date":
        _del_date_item(data_path)

    if sys.argv[1] == "get-template":
        _get_event_template(data_path)

    if sys.argv[1] == "set-date":
        _set_date_item(data_path)
