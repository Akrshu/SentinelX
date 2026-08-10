import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import Investigation from "./pages/Investigation";
import Incidents from "./pages/Incidents";
import IncidentDetail from "./pages/IncidentDetail";
import Trash from "./pages/Trash";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            {/* =============================== */}
            {/* OVERVIEW */}
            {/* =============================== */}

            <Route path="/" element={<Index />} />

            {/* =============================== */}
            {/* INVESTIGATION LAB */}
            {/* =============================== */}

            <Route path="/investigate" element={<Investigation />} />

            {/* =============================== */}
            {/* INCIDENT LIST */}
            {/* =============================== */}

            <Route path="/incidents" element={<Incidents />} />

            {/* =============================== */}
            {/* INCIDENT DETAIL */}
            {/* =============================== */}

            <Route path="/incidents/:incidentId" element={<IncidentDetail />} />

            {/* =============================== */}
            {/* TRASH */}
            {/* =============================== */}

            <Route path="/trash" element={<Trash />} />

            {/* =============================== */}
            {/* FALLBACK */}
            {/* =============================== */}

            <Route path="*" element={<NotFound />} />
          </Routes>

          <Toaster />
          <Sonner />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(<App />);
