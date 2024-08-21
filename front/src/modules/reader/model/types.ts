export interface Chapter {
    title: string;
    content?: string;
    parts?: ChapterPart[];
    charCount: number;
    notes?: HighlightAndNote[];
}

export interface ChapterPart {
    title: string;
    content: string;
    charCount: number;
}
// dont use
export interface Note {
    type: 'pen' | 'speech';
    text: string;
    comment?: string;
}

export interface HighlightAndNote {
  Id: string;                        // Уникальный идентификатор заметки
  Type?: number;                      // Тип заметки (например, выделение или комментарий)
  ContentNum?: number;                // Номер содержания или раздела, в котором сделана заметка
  ColorId: string;                   // Идентификатор цвета выделения (может указывать на важность)
  NoteText?: string | null;           // Текст заметки, если есть (null, если отсутствует)
  SelectionSnippet: string;          // Фрагмент выделенного текста
  SelectionPosition?: number;         // Позиция выделения в тексте (может быть процентом или относительным положением)
  SelectionTocLocation: string;      // Местоположение выделения в оглавлении книги (часть, глава, подраздел)
  SerializedSelection?: string;       // Серийная строка, представляющая точное место выделения в тексте
  TimeStamp: string;                 // Временная метка, когда была сделана заметка
  IsDeleted?: boolean;                // Флаг, указывающий, была ли заметка удалена
  IsFavorite?: boolean;               // Флаг, указывающий, была ли заметка добавлена в избранное
}



// {
//     "$type": "eBookReader.Utility.HighlightAndNote, Aquile Reader",
//     "Id": "aad0d97559304492b2a837962a6aa818",
//     "Type": 0,
//     "ContentNum": 9,
//     "ColorId": "2",
//     "NoteText": null,
//     "SelectionSnippet": "Главной задачей «детектора ошибок» для человека, для его выживания является умение отличать реальность от вымысла, правду ото лжи. Если бы у нас не было этого механизма, то все человечество превратилось бы в людей аутичных либо страдающих шизофренией. Именно эти люди сталкиваются с проблемой функционирования «детектора ошибок», то есть с неправильной работой этой части коры головного мозга. Этим фактом и объясняется странность их поведения с точки зрения социума.",
//     "SelectionPosition": 10.42,
//     "SelectionTocLocation": "Часть 1. Что такое ложь » Глава 3. Детектор ошибок, или Как наш мозг реагирует на ложь",
//     "SerializedSelection": "0/0/26/0/1:0,0/3/26/0/1:74",
//     "TimeStamp": "2024-08-07T23:27:27.3868216+05:00",
//     "IsDeleted": false,
//     "IsFavorite": false
// }