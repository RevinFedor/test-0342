// NavigationParser.tsx
import JSZip from 'jszip';

export interface Chapter {
    label: string;
    href: string;
    level: number;
}

// Функция для парсинга container.xml и получения пути к content.opf
export const getContentOpfPath = async (zip: JSZip): Promise<string> => {
    const containerFile = zip.file('META-INF/container.xml');
    if (!containerFile) throw new Error('META-INF/container.xml not found');
    const containerContent = await containerFile.async('text');
    const parser = new DOMParser();
    const doc = parser.parseFromString(containerContent, 'application/xml');
    const rootfile = doc.querySelector('rootfile');
    if (!rootfile) throw new Error('rootfile element not found in container.xml');
    const opfPath = rootfile.getAttribute('full-path');
    if (!opfPath) throw new Error('full-path attribute not found in rootfile element');
    return opfPath;
};

// Функция для парсинга EPUB 2 TOC (toc.ncx)
export const parseEPUB2TOC = async (zip: JSZip, opfPath: string): Promise<Chapter[]> => {
    // Найти путь к toc.ncx из content.opf
    const contentOpf = zip.file(opfPath);
    if (!contentOpf) throw new Error(`${opfPath} not found`);
    const opfContent = await contentOpf.async('text');
    const parser = new DOMParser();
    const doc = parser.parseFromString(opfContent, 'application/xml');

    // Найти элемент manifest с toc.ncx
    const ncxItem = doc.querySelector('manifest item[media-type="application/x-dtbncx+xml"]');
    if (!ncxItem) throw new Error('toc.ncx not found in manifest');
    const ncxPath = ncxItem.getAttribute('href');
    if (!ncxPath) throw new Error('href attribute not found in toc.ncx item');

    // Определить полный путь к toc.ncx
    const opfDir = opfPath.substring(0, opfPath.lastIndexOf('/') + 1);
    const ncxFullPath = opfDir + ncxPath;

    const tocFile = zip.file(ncxFullPath);
    if (!tocFile) throw new Error(`${ncxFullPath} not found`);
    const tocContent = await tocFile.async('text');
    const tocDoc = parser.parseFromString(tocContent, 'application/xml');

    const navPoints = tocDoc.getElementsByTagName('navPoint');
    const chapters: Chapter[] = Array.from(navPoints).map((item, index) => ({
        label: item.getElementsByTagName('text')[0]?.textContent?.trim() || `Chapter ${index + 1}`,
        href: item.getElementsByTagName('content')[0]?.getAttribute('src') || '',
        level: Number(item.getAttribute('playOrder')) || 0,
    }));

    return chapters;
};

// Функция для парсинга EPUB 3 TOC (nav document)
export const parseEPUB3TOC = async (zip: JSZip, opfPath: string): Promise<Chapter[]> => {
    const contentOpf = zip.file(opfPath);
    if (!contentOpf) throw new Error(`${opfPath} not found`);
    const opfContent = await contentOpf.async('text');
    const parser = new DOMParser();
    const doc = parser.parseFromString(opfContent, 'application/xml');

    // Найти элемент manifest с навигационным документом
    const navItem = doc.querySelector('manifest item[properties~="nav"]');
    if (!navItem) throw new Error('Navigation document not found in manifest');
    const navPath = navItem.getAttribute('href');
    if (!navPath) throw new Error('href attribute not found in navigation document item');

    // Определить полный путь к навигационному документу
    const opfDir = opfPath.substring(0, opfPath.lastIndexOf('/') + 1);
    const navFullPath = opfDir + navPath;

    const navFile = zip.file(navFullPath);
    if (!navFile) throw new Error(`${navFullPath} not found`);
    const navContent = await navFile.async('text');
    const navDoc = parser.parseFromString(navContent, 'application/xhtml+xml');

    // Парсинг навигационного документа (XHTML)
    const navPoints = navDoc.querySelectorAll('nav > ol > li');
    const chapters: Chapter[] = [];

    navPoints.forEach((li, index) => {
        const a = li.querySelector('a');
        if (a) {
            const href = a.getAttribute('href') || '';
            const label = a.textContent?.trim() || `Chapter ${index + 1}`;
            chapters.push({
                label,
                href,
                level: 0, // EPUB 3 может иметь более сложную структуру, здесь можно доработать
            });
        }
    });

    return chapters;
};
