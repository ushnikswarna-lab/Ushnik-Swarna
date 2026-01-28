"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Cloud, Sun, CloudRain, Wind, Droplets, Thermometer } from "lucide-react";
import { cn } from "@/lib/utils";

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  location: string;
}

interface WeatherWidgetProps {
  location?: string;
  className?: string;
}

export function WeatherWidget({ location = "Resort Location", className }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate weather data - in production, integrate with a weather API
    // For now, using dummy data
    setTimeout(() => {
      setWeather({
        temperature: 28,
        condition: "Sunny",
        humidity: 65,
        windSpeed: 12,
        location,
      });
      setLoading(false);
    }, 500);
  }, [location]);

  const getWeatherIcon = (condition: string) => {
    const lower = condition.toLowerCase();
    if (lower.includes("rain")) return CloudRain;
    if (lower.includes("cloud")) return Cloud;
    return Sun;
  };

  if (loading) {
    return (
      <Card className={cn("p-4", className)}>
        <Skeleton className="h-24 w-full" />
      </Card>
    );
  }

  if (!weather) return null;

  const Icon = getWeatherIcon(weather.condition);

  return (
    <Card className={cn("p-4 border-2 hover:border-primary/30 transition-all duration-300", className)}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">{weather.location}</p>
              <p className="text-xs text-muted-foreground">Current Weather</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{weather.temperature}°C</p>
              <p className="text-xs text-muted-foreground">{weather.condition}</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Humidity</p>
              <p className="text-sm font-semibold">{weather.humidity}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Wind</p>
              <p className="text-sm font-semibold">{weather.windSpeed} km/h</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
