import nodemailer from "nodemailer"
import { format } from "date-fns"

// Lazy initialization to avoid build-time errors when env vars are missing
let _transporter: nodemailer.Transporter | null = null
let _newsletterTransporter: nodemailer.Transporter | null = null

function getEnvVars() {
  const INFO_EMAIL = process.env.INFO_EMAIL
  const INFO_APP_PASSWORD = process.env.INFO_APP_PASSWORD
  if (!INFO_EMAIL || !INFO_APP_PASSWORD) {
    throw new Error("INFO_EMAIL and INFO_APP_PASSWORD environment variables must be set")
  }
  return { INFO_EMAIL, INFO_APP_PASSWORD }
}

function getTransporter() {
  if (!_transporter) {
    const { INFO_EMAIL, INFO_APP_PASSWORD } = getEnvVars()
    _transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: INFO_EMAIL,
        pass: INFO_APP_PASSWORD,
      },
    })
  }
  return _transporter
}

function getNewsletterTransporter() {
  if (!_newsletterTransporter) {
    const { INFO_EMAIL, INFO_APP_PASSWORD } = getEnvVars()
    const NEWSLETTER_EMAIL = process.env.NEWSLETTER_EMAIL || INFO_EMAIL
    const NEWSLETTER_APP_PASSWORD = process.env.NEWSLETTER_APP_PASSWORD || INFO_APP_PASSWORD
    if (NEWSLETTER_EMAIL !== INFO_EMAIL || NEWSLETTER_APP_PASSWORD !== INFO_APP_PASSWORD) {
      _newsletterTransporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: NEWSLETTER_EMAIL,
          pass: NEWSLETTER_APP_PASSWORD,
        },
      })
    } else {
      _newsletterTransporter = getTransporter()
    }
  }
  return _newsletterTransporter
}

function getInfoEmail() {
  return getEnvVars().INFO_EMAIL
}

function getNewsletterEmail() {
  const { INFO_EMAIL } = getEnvVars()
  return process.env.NEWSLETTER_EMAIL || INFO_EMAIL
}

export interface ContactFormData {
  name: string
  company: string
  email: string
  phone: string
  projectRequirement: string
}


export async function sendContactEmail(data: ContactFormData, clientIp: string): Promise<void> {
  const mailOptions = {
    from: getInfoEmail(),
    to: getInfoEmail(),
    replyTo: data.email,
    subject: `P2tEcostay Contact Form: ${data.name}${data.company ? ` from ${data.company}` : ''}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Contact Form Submission</h2>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
          <p><strong>Company:</strong> ${escapeHtml(data.company)}</p>
          <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(data.phone)}</p>
          <p><strong>Inquiry Details:</strong></p>
          <p style="white-space: pre-wrap;">${escapeHtml(data.projectRequirement)}</p>
        </div>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
          <p><strong>IP Address:</strong> ${clientIp}</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        </div>
      </div>
    `,
    text: `
New Contact Form Submission

Name: ${data.name}
Company: ${data.company}
Email: ${data.email}
Phone: ${data.phone}

Inquiry Details:
${data.projectRequirement}

---
IP Address: ${clientIp}
Timestamp: ${new Date().toISOString()}
    `,
  }

  await getTransporter().sendMail(mailOptions)
}

export async function sendReplyEmail(
  toEmail: string,
  toName: string,
  message: string
): Promise<void> {
  const mailOptions = {
    from: getInfoEmail(),
    to: toEmail,
    subject: `Re: Your inquiry to P2tEcostay Resort`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Thank you for contacting P2tEcostay Resort</h2>
        <p>Dear ${escapeHtml(toName)},</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
        </div>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
          <p>Best regards,<br>P2tEcostay Resort Team</p>
        </div>
      </div>
    `,
    text: `
Thank you for contacting P2tEcostay Resort

Dear ${toName},

${message}

Best regards,
P2tEcostay Resort Team
    `,
  }

  await getTransporter().sendMail(mailOptions)
}

export interface BookingVerificationEmailParams {
  guestEmail: string
  guestName: string
  verifyLink: string
  notMeLink: string
  referenceNumber?: string
}

export async function sendBookingIsItYouEmail(params: BookingVerificationEmailParams): Promise<void> {
  const { guestEmail, guestName, verifyLink, notMeLink, referenceNumber } = params
  const mailOptions = {
    from: getInfoEmail(),
    to: guestEmail,
    subject: `Is it you? – Confirm your P2tEcostay booking${referenceNumber ? ` (${referenceNumber})` : ""}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Is it you?</h2>
        <p>Hi ${escapeHtml(guestName)},</p>
        <p>We received a booking request using this email address. Please confirm it was you:</p>
        <div style="margin: 24px 0;">
          <a href="${escapeHtml(verifyLink)}" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Yes, it's me – Verify</a>
        </div>
        <p style="color: #666;">If you did not make this booking, click below:</p>
        <div style="margin: 24px 0;">
          <a href="${escapeHtml(notMeLink)}" style="display: inline-block; color: #666; text-decoration: underline;">Not me</a>
        </div>
        ${referenceNumber ? `<p style="font-size: 12px; color: #888;">Booking reference: ${escapeHtml(referenceNumber)}</p>` : ""}
        <p style="margin-top: 24px; font-size: 12px; color: #666;">P2tEcostay Resort</p>
      </div>
    `,
    text: `
Is it you?

Hi ${guestName},

We received a booking request using this email. Please confirm:

Yes, it's me: ${verifyLink}

Not me: ${notMeLink}

${referenceNumber ? `Booking reference: ${referenceNumber}` : ""}

P2tEcostay Resort
    `,
  }
  await getTransporter().sendMail(mailOptions)
}

export async function sendBookingVerifiedEmail(guestEmail: string, guestName: string): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://p2tecostay.com"
  const loginUrl = `${baseUrl.replace(/\/$/, "")}/login?redirect=/dashboard`
  const mailOptions = {
    from: getInfoEmail(),
    to: guestEmail,
    subject: "Email verified – P2tEcostay booking",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Email verified</h2>
        <p>Hi ${escapeHtml(guestName)},</p>
        <p>Your email has been verified. Sign in to view and manage your bookings:</p>
        <p><a href="${escapeHtml(loginUrl)}" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Sign in</a></p>
        <p style="margin-top: 24px; font-size: 12px; color: #666;">P2tEcostay Resort</p>
      </div>
    `,
    text: `Email verified. Sign in: ${loginUrl}\n\nP2tEcostay Resort`,
  }
  await getTransporter().sendMail(mailOptions)
}

export async function sendBookingReceivedEmail(
  guestEmail: string,
  guestName: string,
  referenceNumber: string
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || ""
  const dashboardUrl = baseUrl ? `${baseUrl.replace(/\/$/, "")}/login?redirect=/dashboard` : "/login?redirect=/dashboard"
  const mailOptions = {
    from: getInfoEmail(),
    to: guestEmail,
    subject: `Booking received – ${referenceNumber} | P2tEcostay`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Booking received</h2>
        <p>Hi ${escapeHtml(guestName)},</p>
        <p>We have received your booking request. Reference: <strong>${escapeHtml(referenceNumber)}</strong></p>
        <p>Our team will confirm availability and get back to you within 24 hours.</p>
        <p><a href="${escapeHtml(dashboardUrl)}" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">View my booking</a></p>
        <p style="margin-top: 24px; font-size: 12px; color: #666;">P2tEcostay Resort</p>
      </div>
    `,
    text: `Booking received. Reference: ${referenceNumber}. View: ${dashboardUrl}\n\nP2tEcostay Resort`,
  }
  await getTransporter().sendMail(mailOptions)
}

export interface BookingNotificationEmailParams {
  referenceNumber: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  accommodationTitle?: string;
  checkInDates?: string[];
  numberOfRooms?: number;
  adults: number;
  children: number;
  totalAmount?: number;
  specialRequests?: string;
}

export async function sendBookingNotificationToAdmin(params: BookingNotificationEmailParams): Promise<void> {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || getInfoEmail();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const adminUrl = baseUrl ? `${baseUrl.replace(/\/$/, "")}/admin/bookings` : "/admin/bookings";
  
  const datesDisplay = params.checkInDates && params.checkInDates.length > 0
    ? params.checkInDates.map(d => format(new Date(d), "MMM dd, yyyy")).join(", ")
    : "N/A";
  
  const mailOptions = {
    from: getInfoEmail(),
    to: adminEmail,
    subject: `New Booking Request – ${params.referenceNumber} | P2tEcostay`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Booking Request</h2>
        <p>A new booking has been received:</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Reference Number:</strong> ${escapeHtml(params.referenceNumber)}</p>
          <p><strong>Guest Name:</strong> ${escapeHtml(params.guestName)}</p>
          <p><strong>Email:</strong> <a href="mailto:${escapeHtml(params.guestEmail)}">${escapeHtml(params.guestEmail)}</a></p>
          ${params.guestPhone ? `<p><strong>Phone:</strong> ${escapeHtml(params.guestPhone)}</p>` : ""}
          ${params.accommodationTitle ? `<p><strong>Accommodation:</strong> ${escapeHtml(params.accommodationTitle)}</p>` : ""}
          <p><strong>Check-in Dates:</strong> ${datesDisplay}</p>
          ${params.numberOfRooms ? `<p><strong>Number of Rooms:</strong> ${params.numberOfRooms}</p>` : ""}
          <p><strong>Guests:</strong> ${params.adults} Adult${params.adults !== 1 ? "s" : ""}${params.children > 0 ? `, ${params.children} Child${params.children !== 1 ? "ren" : ""}` : ""}</p>
          ${params.totalAmount ? `<p><strong>Total Amount:</strong> ₹${params.totalAmount.toLocaleString()}</p>` : ""}
          ${params.specialRequests ? `<p><strong>Special Requests:</strong><br>${escapeHtml(params.specialRequests).replace(/\n/g, "<br>")}</p>` : ""}
        </div>
        <p><a href="${escapeHtml(adminUrl)}" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View in Admin Panel</a></p>
        <p style="margin-top: 24px; font-size: 12px; color: #666;">P2tEcostay Resort Admin</p>
      </div>
    `,
    text: `
New Booking Request

Reference Number: ${params.referenceNumber}
Guest Name: ${params.guestName}
Email: ${params.guestEmail}
${params.guestPhone ? `Phone: ${params.guestPhone}` : ""}
${params.accommodationTitle ? `Accommodation: ${params.accommodationTitle}` : ""}
Check-in Dates: ${datesDisplay}
${params.numberOfRooms ? `Number of Rooms: ${params.numberOfRooms}` : ""}
Guests: ${params.adults} Adult${params.adults !== 1 ? "s" : ""}${params.children > 0 ? `, ${params.children} Child${params.children !== 1 ? "ren" : ""}` : ""}
${params.totalAmount ? `Total Amount: ₹${params.totalAmount.toLocaleString()}` : ""}
${params.specialRequests ? `Special Requests: ${params.specialRequests}` : ""}

View in Admin Panel: ${adminUrl}

P2tEcostay Resort Admin
    `,
  }
  await getTransporter().sendMail(mailOptions)
}

export async function sendNewsletterEmail(
  toEmail: string,
  subject: string,
  content: string
): Promise<void> {
  const mailOptions = {
    from: getNewsletterEmail(),
    to: toEmail,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          ${content.replace(/\n/g, "<br>")}
        </div>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
          <p>Best regards,<br>P2tEcostay Resort Team</p>
          <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || ""}/newsletter/unsubscribe?email=${encodeURIComponent(toEmail)}" style="color: #666; text-decoration: underline;">Unsubscribe</a></p>
        </div>
      </div>
    `,
    text: `${content}\n\nBest regards,\nP2tEcostay Resort Team`,
  }
  await getNewsletterTransporter().sendMail(mailOptions)
}

export interface BookingStatusChangeEmailParams {
  guestEmail: string;
  guestName: string;
  referenceNumber: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  accommodationTitle?: string;
  checkInDates?: string[];
  numberOfRooms?: number;
  totalAmount?: number;
}

export async function sendBookingStatusChangeEmail(params: BookingStatusChangeEmailParams): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const dashboardUrl = baseUrl ? `${baseUrl.replace(/\/$/, "")}/login?redirect=/dashboard` : "/login?redirect=/dashboard";
  const trackUrl = baseUrl ? `${baseUrl.replace(/\/$/, "")}/track-booking?reference=${params.referenceNumber}` : `/track-booking?reference=${params.referenceNumber}`;
  
  const statusMessages: Record<string, { subject: string; message: string; color: string }> = {
    confirmed: {
      subject: `Booking Confirmed – ${params.referenceNumber} | P2tEcostay`,
      message: "Your booking has been confirmed! We're excited to host you.",
      color: "#22c55e"
    },
    cancelled: {
      subject: `Booking Cancelled – ${params.referenceNumber} | P2tEcostay`,
      message: "Your booking has been cancelled. If you have any questions, please contact us.",
      color: "#ef4444"
    },
    completed: {
      subject: `Thank You for Your Stay – ${params.referenceNumber} | P2tEcostay`,
      message: "Thank you for staying with us! We hope you enjoyed your experience.",
      color: "#3b82f6"
    },
    pending: {
      subject: `Booking Update – ${params.referenceNumber} | P2tEcostay`,
      message: "Your booking status has been updated.",
      color: "#eab308"
    }
  };

  const statusInfo = statusMessages[params.status] || statusMessages.pending;
  const datesDisplay = params.checkInDates && params.checkInDates.length > 0
    ? params.checkInDates.map(d => format(new Date(d), "MMM dd, yyyy")).join(", ")
    : "N/A";

  const mailOptions = {
    from: getInfoEmail(),
    to: params.guestEmail,
    subject: statusInfo.subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${statusInfo.message}</h2>
        <p>Hi ${escapeHtml(params.guestName)},</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Reference Number:</strong> ${escapeHtml(params.referenceNumber)}</p>
          <p><strong>Status:</strong> <span style="color: ${statusInfo.color}; font-weight: bold; text-transform: capitalize;">${params.status}</span></p>
          ${params.accommodationTitle ? `<p><strong>Accommodation:</strong> ${escapeHtml(params.accommodationTitle)}</p>` : ""}
          <p><strong>Check-in Dates:</strong> ${datesDisplay}</p>
          ${params.numberOfRooms ? `<p><strong>Number of Rooms:</strong> ${params.numberOfRooms}</p>` : ""}
          ${params.totalAmount ? `<p><strong>Total Amount:</strong> ₹${params.totalAmount.toLocaleString()}</p>` : ""}
        </div>
        <div style="margin-top: 20px;">
          <a href="${escapeHtml(dashboardUrl)}" style="display: inline-block; background: ${statusInfo.color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-right: 10px;">View in Dashboard</a>
          <a href="${escapeHtml(trackUrl)}" style="display: inline-block; background: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Track Booking</a>
        </div>
        <p style="margin-top: 24px; font-size: 12px; color: #666;">P2tEcostay Resort</p>
      </div>
    `,
    text: `
${statusInfo.message}

Hi ${params.guestName},

Reference Number: ${params.referenceNumber}
Status: ${params.status}
${params.accommodationTitle ? `Accommodation: ${params.accommodationTitle}` : ""}
Check-in Dates: ${datesDisplay}
${params.numberOfRooms ? `Number of Rooms: ${params.numberOfRooms}` : ""}
${params.totalAmount ? `Total Amount: ₹${params.totalAmount.toLocaleString()}` : ""}

View in Dashboard: ${dashboardUrl}
Track Booking: ${trackUrl}

P2tEcostay Resort
    `,
  }
  await getTransporter().sendMail(mailOptions)
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

