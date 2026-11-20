import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
	CalendarDays,
	Landmark,
	ShieldCheck,
	Trophy,
	Users,
	UsersRound,
	Wand2,
} from "lucide-react";
import { useState } from "react";

import { SetupWizard } from "@/components/SetupWizard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

import { api } from "../../convex/_generated/api";
import { Button } from "../components/ui/button";
