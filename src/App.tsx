import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import RoomStatus from "./pages/RoomStatus";  // <-- added
import Home from "./pages/Home";              // <-- only if you actually have Home.tsx

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <BrowserRouter>
        <Routes>

          {/* MAIN PAGE */}
          <Route path="/" element={<Index />} />

          {/* ROOM STATUS PAGE */}
          <Route path="/room" element={<RoomStatus />} />

          {/* OPTIONAL HOME PAGE — remove if you don’t have Home.tsx */}
          {/* <Route path="/home" element={<Home />} /> */}

          {/* 404 CATCH-ALL (must remain LAST) */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </BrowserRouter>

    </TooltipProvider>
  </QueryClientProvider>
);

export default App;