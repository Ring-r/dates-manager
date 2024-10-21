import { FileType } from "rsuite/esm/Uploader";
import { Data, dbVersion } from "./data_base";
import { FirestoreData, FirestoreEventbase } from "./data_firestore";

export const data_filename = "dates.json";

function convert_data_to_nosql(data: Data): FirestoreData {
  const nosql_eventbase_list: FirestoreEventbase[] = data.eventbase_list.map(eventbase => ({
    ...eventbase,
    milestone_list: undefined,
  }));

  const nosql_eventbase_map = new Map(nosql_eventbase_list.map(nosql_eventbase => [nosql_eventbase.uid, nosql_eventbase]));
  data.milestone_list.forEach(milestone => {
    const nosql_eventbase = nosql_eventbase_map.get(milestone.eventbase.uid);
    if (!nosql_eventbase) return; // todo: error in data. what to do?

    nosql_eventbase.milestone_list = [
      ...nosql_eventbase.milestone_list || [],
      {
        date_year: milestone.date_year,

        state: milestone.state,
        story: milestone.story,
      },
    ];
  });

  return {
    dbVersion,
    eventbase_list: nosql_eventbase_list,
  }
}

function convert_nosql_to_data(nosql_data: FirestoreData): Data {
  const data: Data = {
    dbVersion: nosql_data.dbVersion,
    eventbase_list: [],
    milestone_list: [],
  };
  for (let nosql_eventbase of nosql_data.eventbase_list) {
    const eventbase = {
      uid: nosql_eventbase.uid,
      date_year: nosql_eventbase.date_year,
      date_month: nosql_eventbase.date_month,
      date_day: nosql_eventbase.date_day,
      title: nosql_eventbase.title,
      actor: nosql_eventbase.actor,
    }
    data.eventbase_list.push(eventbase);
    data.milestone_list.push(
      ...(nosql_eventbase.milestone_list || []).map(nosql_milestone => ({
        date_year: nosql_milestone.date_year,
        eventbase: eventbase,
        state: nosql_milestone.state,
        story: nosql_milestone.story,
      }))
    );
  }
  return data;
}

export function file_load(file_type: FileType): Promise<Data> {
  return new Promise((resolve, reject) => {
    const blob = file_type.blobFile;
    if (!blob) {
      reject();
      return;
    }

    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      try {
        const result = event.target?.result as string;
        const nosql_data = JSON.parse(result) as FirestoreData;

        const data = convert_nosql_to_data(nosql_data);

        resolve(data);
      } catch (error) {
        console.error("Error parsing JSON:", error);
        reject();
      }
    };
    reader.readAsText(blob);
  });
};

export function file_save(data: Data): void {
  const nosql_data = convert_data_to_nosql(data);

  const json = JSON.stringify(nosql_data, null, "\t");
  const blob = new Blob([json], { type: "text/json" });

  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = data_filename;

  // Append the anchor to the body (it must be in the DOM for the click to work in some browsers)
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
