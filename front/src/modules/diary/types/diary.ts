import { FLAT_SOURCE_TYPES, ForwardOrigin } from '@/modules/filters/model/types/filter';

// src/api/types.ts
export interface WeatherInfo {
    id: number;
    date: string;
    mainCondition: string;
    description: string;
    iconId: string;
    conditionId: number;
    temperature: number;
    sunrise: string;
    sunset: string;
    cloudiness: number;
    windSpeed: number;
    windDirection: number;
}

export interface LocationInfo {
    id: number;
    address: string;
    latitude: number;
    longitude: number;
    dateCreated: string;
}

export interface ImageInfo {
    _id: any;
    id: number;
    path: string;
    fileName: string;
    dateAdded: string;
    diaryEntryId: number;
    isHeaderImage: boolean;
}

export interface Tag {
    _id: string;
    name: string;
}


// export interface ForwardOrigin {
//     // [number] используется для указания, что тип переменной может быть любым из типов элементов массива
//     type: (typeof FLAT_SOURCE_TYPES)[number];
//     subtype?: (typeof FLAT_SOURCE_TYPES)[number];
//     title?: string;
//     username?: string;
//     firstName?: string;
//     lastName?: string;
//     isHidden?: boolean;
//     channelId?: string;
//     userId?: string;
// }

export interface DiaryEntry {
    _id: any;
    id: number;
    title: string;
    content: string;
    createdAt: string;
    diaryDate: string;
    weatherInfo?: WeatherInfo;
    createdAtLocation?: LocationInfo;
    images: ImageInfo[];
    tags: Tag[];
    forward_origin?: ForwardOrigin;
}
