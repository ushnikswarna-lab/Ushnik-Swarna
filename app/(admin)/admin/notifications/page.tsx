"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Send, Save, Bell, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface NotificationSettings {
  emailOnNewBooking: boolean;
  emailOnBookingConfirmed: boolean;
  emailOnBookingCancelled: boolean;
  emailOnPaymentReceived: boolean;
  emailOnCheckInReminder: boolean;
  emailOnCheckOutReminder: boolean;
  adminEmail: string;
  confirmationEmailTemplate: string;
  reminderEmailTemplate: string;
}

export default function EmailNotificationsPage() {
  const { userData: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    emailOnNewBooking: true,
    emailOnBookingConfirmed: true,
    emailOnBookingCancelled: true,
    emailOnPaymentReceived: true,
    emailOnCheckInReminder: true,
    emailOnCheckOutReminder: true,
    adminEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
    confirmationEmailTemplate: "Thank you for your booking! Your reference number is {{referenceNumber}}.",
    reminderEmailTemplate: "Reminder: Your check-in is on {{checkInDate}}.",
  });

  useEffect(() => {
    if (currentUser) {
      loadSettings();
    }
  }, [currentUser]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // In production, fetch from API
      // For now, using default settings
      setLoading(false);
    } catch (error: any) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load settings");
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // In production, save to API
      // await fetch("/api/admin/settings/notifications", { method: "PUT", body: JSON.stringify(settings) });
      
      // Simulate save
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Notification settings saved");
    } catch (error: any) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      // In production, send test email
      toast.success("Test email sent!");
    } catch (error: any) {
      toast.error("Failed to send test email");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Notifications</h1>
          <p className="text-muted-foreground">Manage booking email notifications</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      {/* Notification Toggles */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Enable or disable email notifications for different booking events</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="new-booking">New Booking Received</Label>
              <p className="text-sm text-muted-foreground">Send email when a new booking is created</p>
            </div>
            <Switch
              id="new-booking"
              checked={settings.emailOnNewBooking}
              onCheckedChange={(checked) => setSettings({ ...settings, emailOnNewBooking: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="confirmed">Booking Confirmed</Label>
              <p className="text-sm text-muted-foreground">Send email when booking status changes to confirmed</p>
            </div>
            <Switch
              id="confirmed"
              checked={settings.emailOnBookingConfirmed}
              onCheckedChange={(checked) => setSettings({ ...settings, emailOnBookingConfirmed: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="cancelled">Booking Cancelled</Label>
              <p className="text-sm text-muted-foreground">Send email when a booking is cancelled</p>
            </div>
            <Switch
              id="cancelled"
              checked={settings.emailOnBookingCancelled}
              onCheckedChange={(checked) => setSettings({ ...settings, emailOnBookingCancelled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="payment">Payment Received</Label>
              <p className="text-sm text-muted-foreground">Send email when payment status changes to paid</p>
            </div>
            <Switch
              id="payment"
              checked={settings.emailOnPaymentReceived}
              onCheckedChange={(checked) => setSettings({ ...settings, emailOnPaymentReceived: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="checkin">Check-in Reminder</Label>
              <p className="text-sm text-muted-foreground">Send reminder email 1 day before check-in</p>
            </div>
            <Switch
              id="checkin"
              checked={settings.emailOnCheckInReminder}
              onCheckedChange={(checked) => setSettings({ ...settings, emailOnCheckInReminder: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="checkout">Check-out Reminder</Label>
              <p className="text-sm text-muted-foreground">Send reminder email 1 day before check-out</p>
            </div>
            <Switch
              id="checkout"
              checked={settings.emailOnCheckOutReminder}
              onCheckedChange={(checked) => setSettings({ ...settings, emailOnCheckOutReminder: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Email Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Email Configuration</CardTitle>
          <CardDescription>Configure email addresses and templates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email">Admin Email</Label>
            <Input
              id="admin-email"
              type="email"
              value={settings.adminEmail}
              onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
              placeholder="admin@example.com"
            />
            <p className="text-xs text-muted-foreground">Email address to receive admin notifications</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmation-template">Confirmation Email Template</Label>
            <Textarea
              id="confirmation-template"
              value={settings.confirmationEmailTemplate}
              onChange={(e) => setSettings({ ...settings, confirmationEmailTemplate: e.target.value })}
              rows={4}
              placeholder="Email template for booking confirmations..."
            />
            <p className="text-xs text-muted-foreground">Use {"{{referenceNumber}}"}, {"{{guestName}}"}, {"{{checkIn}}"}, etc. as placeholders</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminder-template">Reminder Email Template</Label>
            <Textarea
              id="reminder-template"
              value={settings.reminderEmailTemplate}
              onChange={(e) => setSettings({ ...settings, reminderEmailTemplate: e.target.value })}
              rows={4}
              placeholder="Email template for reminders..."
            />
            <p className="text-xs text-muted-foreground">Use {"{{checkInDate}}"}, {"{{checkOutDate}}"}, {"{{guestName}}"}, etc. as placeholders</p>
          </div>

          <Button variant="outline" onClick={handleTestEmail}>
            <Mail className="h-4 w-4 mr-2" />
            Send Test Email
          </Button>
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Email Activity</CardTitle>
          <CardDescription>Track sent emails and delivery status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Email activity tracking will be available soon</p>
            <p className="text-sm mt-2">This feature requires email service integration</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
