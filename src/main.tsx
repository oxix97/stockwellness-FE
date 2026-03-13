import {createRoot} from "react-dom/client";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";
import {Toaster} from "sonner";
import {ThemeProvider} from "next-themes";
import App from "@/app/App.tsx";
import "./styles/index.css";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

createRoot(document.getElementById("root")!).render(
    <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <App/>
            <Toaster position="top-center" richColors/>
            <ReactQueryDevtools initialIsOpen={false}/>
        </ThemeProvider>
    </QueryClientProvider>
);
  