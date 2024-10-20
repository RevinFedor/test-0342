export interface Chapter {
    label: string;
    href: string;
    cfi: string; // CFI можно вычислить позже, если потребуется
    level: number; // Представляет уровень вложенности
    children?: Chapter[];
}
