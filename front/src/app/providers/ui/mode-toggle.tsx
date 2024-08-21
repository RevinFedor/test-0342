import { Moon, Sun } from 'lucide-react';

import { useTheme } from './theme-provider';
import { Switch } from '@/shared/ui/components/ui/switch';

export function ModeToggle() {
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <div className="flex items-center">
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Switch
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
                className="mx-2"
            />
            <Moon className="h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </div>
    );
}