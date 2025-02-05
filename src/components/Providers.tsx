"use client"

import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactNode } from "react";

const client = new QueryClient();

// we will wrap our entire app inside of this QueryClientProvider
//   which is really good at caching
// Anywhere we fetch data, then fetch the same data a bit later, like ten seconds later..
//   This will cache this data, and then second fetch will get the data from the cache
const Providers = ({children}: {children: ReactNode}) => {
    return (
        <QueryClientProvider client={client}>
            {children}
        </QueryClientProvider>
    );
}

export default Providers;