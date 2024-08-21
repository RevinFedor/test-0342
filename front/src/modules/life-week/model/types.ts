// данные что придут из запроса
export interface EventEntry {
    id: string;
    title: string;
}

export interface EventData {
    date: string;
    entries: EventEntry[];
}

export interface DiaryDatesQueryResult {
    data?: EventData[];
    isSuccess: boolean;
}

// 
export interface DobState {
    month: string;
    day: string;
    year: string;
}
