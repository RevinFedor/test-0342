import { ReactNode } from 'react';
import { Provider } from 'react-redux';

import { createReduxStore, StateSchema } from '../config/store';

interface StoreProviderProps {
    children?: ReactNode;
    initialState?: StateSchema;
}

export const StoreProvider = (props: StoreProviderProps) => {
    const { children, initialState } = props;
    //! const navigate = useNavigate();

    const store = createReduxStore(initialState);

    return <Provider store={store}>{children}</Provider>;
};
