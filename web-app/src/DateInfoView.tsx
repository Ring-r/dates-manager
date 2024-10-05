import { Checkbox, DatePicker, HStack, Input, Panel } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';
import AssigneeView from './AssigneeViewer';
import TypeView from './TypeViewer';


export interface DateInfo {
    uid: number; // auto

    type_uid?: number;  // todo: it would be good to use `type_name`

    date: Date;
    include_year: boolean;  // default: False

    assignee_uid?: number,  // optional because "01.01. New Year.". todo: it would be good to use `assignee_name`

    // Q: can be difference between date_assignee and event_assignee? maybe it is better to include date_assingee to date_description. it is simplify implementation.

    description?: string  // details? "It is a day of first date. We met at a cozy little café on a rainy afternoon. The atmosphere was warm and welcoming, with the smell of fresh coffee in the air. We talked about our favorite books and movies, discovering we had a lot in common. There were a few moments of awkward laughter, but it felt natural and easy to be ourselves. By the time we said goodbye, the rain had stopped, and I couldn't help but smile, knowing I wanted to see them again."
}

function DateInfoView({date_info}: {date_info: DateInfo}) {
  return (
    <Panel style={{ width: '100%' }}>

        {/* type */}
        <TypeView uid_param={date_info.type_uid} />

        {/* date */}
        <HStack style={{ width: '100%' }}>
          <DatePicker style={{ width: '100%' }} defaultValue={date_info.date} />
          <Checkbox defaultChecked={date_info.include_year} >unknow year</Checkbox>
        </HStack>

        {/* assignee */}
        <AssigneeView uid_param={date_info.assignee_uid} />

        {/* description */}
        <HStack style={{ width: '100%' }}>
          <Input as="textarea" placeholder="description" defaultValue={date_info.description} style={{ width: '100%' }} />
        </HStack>
    </Panel>
  )
}

export default DateInfoView;
