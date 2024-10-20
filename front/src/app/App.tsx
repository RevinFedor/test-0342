import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './providers/ui/theme-provider';

import { lazy, Suspense } from 'react';
import Reword from '@/modules/reword-export/ui/Reword';
import { Toaster } from '@/shared/ui/components/ui/toaster';
import DiaryEntryPage from '@/modules/diary/ui/DiaryEntryPage';
import Library from '@/modules/book-library/ui/main-library/Library';
import BookReader from '@/modules/book-library/ui/BookReader';
import TableHr from '@/pages/T/TableHr';
import BookReaderJSZip from '@/modules/book-library/ui/BookReaderJSZip';

const DiaryPage = lazy(() => import('@/pages/DiaryPage').then((module) => ({ default: module.DiaryPage })));
const LifeWeeksChart = lazy(() => import('@/modules/life-week/ui/LifeWeeksChart'));
const Reader = lazy(() => import('@/modules/reader/ui/Reader'));
const Header = lazy(() => import('@/shared/ui/Header'));

function App() {
    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <Suspense fallback={<div>Loading...</div>}>
                <BrowserRouter>
                    <Header />
                    <Routes>
                        <Route path="/" element={<DiaryPage />} />
                        <Route path="/:id" element={<DiaryEntryPage />} />
                        <Route path="/LifeWeeks" element={<LifeWeeksChart />} />
                        <Route path="/Reader" element={<Reader />} />
                        <Route path="/Reword" element={<Reword />} />
                        <Route path="/Library" element={<Library />} />
                        <Route path="/Library/:id" element={<BookReader />} />
                        <Route path="/LibraryZip/:id" element={<BookReaderJSZip />} />
                        <Route path="/Table" element={<TableHr />} />
                    </Routes>
                    <Toaster />
                </BrowserRouter>
            </Suspense>
        </ThemeProvider>
    );
}

export default App;
