"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import UserMenu from "./UserMenu";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/search", label: "Search" },
  { href: "/import", label: "Import" },
  { href: "/stats", label: "Stats" },
  { href: "/lists", label: "Lists" },
];
