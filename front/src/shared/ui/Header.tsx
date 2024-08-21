import { ModeToggle } from '@/app/providers/ui/mode-toggle';

import { NavLink } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/ui/components/ui/dropdown-menu';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/shared/ui/components/ui/button';

const Header = () => {
    return (
        <header className="bg-slate-200 dark:bg-violet-950 p-4">
            <nav className="container mx-auto flex justify-between">
                <ul className="flex space-x-4">
                    <li>
                        <NavLink to="/" className={({ isActive }) => (isActive ? 'text-blue-400' : 'hover:text-gray-300')}>
                            Home
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/LifeWeeks" className={({ isActive }) => (isActive ? 'text-blue-400' : 'hover:text-gray-300')}>
                            LifeWeeks
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/Reader" className={({ isActive }) => (isActive ? 'text-blue-400' : 'hover:text-gray-300')}>
                            Reader
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/Reword" className={({ isActive }) => (isActive ? 'text-blue-400' : 'hover:text-gray-300')}>
                            ReWord Export
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/Library" className={({ isActive }) => (isActive ? 'text-blue-400' : 'hover:text-gray-300')}>
                              Library
                        </NavLink>
                    </li>
                    {/* Add more links as needed */}
                </ul>
                <ModeToggle />


            </nav>
        </header>
    );
};

export default Header;
