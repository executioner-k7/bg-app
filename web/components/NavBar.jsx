"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Eye, EyeOff, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { languages, useLanguage } from "@/components/LanguageContext";
import { emit, on, useSocketStatus } from "@/lib/socket";
import { useScreenShare } from "@/components/ScreenShare";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

function ThemeDropdown() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    return on("theme:update", (next) => {
      if (themeOptions.some((option) => option.value === next)) {
        setTheme(next);
      }
    });
  }, [setTheme]);

  const current = mounted
    ? themeOptions.find((option) => option.value === theme)
    : undefined;
  const Icon = current?.icon ?? Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" aria-label="Theme" />}
      >
        <Icon />
        {mounted ? (current?.label ?? "Theme") : "Theme"} <ChevronDown />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={mounted ? theme : "system"}
          onValueChange={(next) => {
            setTheme(next);
            emit("theme:change", next);
          }}
        >
          {themeOptions.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              <option.icon />
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LanguageDropdown() {
  const { language, setLanguage } = useLanguage();
  const current = languages.find((item) => item.value === language);

  useEffect(() => {
    return on("language:update", (next) => {
      if (languages.some((item) => item.value === next)) {
        setLanguage(next);
      }
    });
  }, [setLanguage]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" aria-label="Editor language" />}
      >
        {current?.label ?? "Language"} <ChevronDown />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={language}
          onValueChange={(next) => {
            setLanguage(next);
            emit("language:change", next);
          }}
        >
          {languages.map((item) => (
            <DropdownMenuRadioItem key={item.value} value={item.value}>
              {item.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function NavBar() {
  const connected = useSocketStatus();
  const {
    isSharer,
    someoneElseSharing,
    shareScreen,
    stopShare,
    viewing,
    toggleView,
  } = useScreenShare();

  return (
    <nav className="relative z-50 flex items-center justify-between px-5 py-2">
      <div className="flex items-center gap-3">
        <a href="/" className="flex items-center gap-2 ">
          <Button variant="default" size="lg">asdfasdf</Button>
        </a>
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span
            className={`size-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`}
            aria-hidden="true"
          />
          {connected ? "Connected" : "Disconnected"}
        </span>
      </div>
      <div className="flex items-center gap-8">
      <LanguageDropdown />
      <Button
        variant="outline"
        size="lg"
        disabled={!connected || someoneElseSharing}
        onClick={() => shareScreen()}
      >
        share screen
      </Button>
      <Button
        variant="outline"
        size="lg"
        disabled={!isSharer}
        onClick={stopShare}
      >
        stop share
      </Button>
      <Button
        variant={viewing ? "default" : "outline"}
        size="icon-lg"
        aria-label={viewing ? "Show code editor" : "View screen"}
        aria-pressed={viewing}
        disabled={!connected || isSharer || (!someoneElseSharing && !viewing)}
        onClick={toggleView}
      >
        {viewing ? <EyeOff /> : <Eye />}
      </Button>
      <ThemeDropdown />
      </div>
    </nav>
  );
}
