import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useNavigate,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { ChartNoAxesCombined, Home, Moon, Plus, ReceiptText, Sun, Users, type LucideIcon } from "lucide-react";

import appCss from "../styles.css?url";
import themeCss from "../theme-gadeer.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
const ghadeerLogo = { url: "/ghadeer-logo.png" };
