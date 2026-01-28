import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";

// GET: Check availability for dates and rooms
export async function GET(request: NextRequest) {
  try {
    const db = getFirestore();
    const { searchParams } = new URL(request.url);
    const accommodationId = searchParams.get("accommodationId");
    const datesParam = searchParams.get("dates"); // Comma-separated dates: "2025-01-15,2025-01-16"
    const numberOfRooms = searchParams.get("numberOfRooms") ? Number(searchParams.get("numberOfRooms")) : 1;
    const getAllAccommodations = searchParams.get("getAllAccommodations") === "true"; // New: return all accommodations with availability

    if (!datesParam && !getAllAccommodations) {
      return NextResponse.json(
        { error: "dates parameter is required (comma-separated dates: YYYY-MM-DD) or getAllAccommodations=true" },
        { status: 400 }
      );
    }

    // Parse dates if provided
    const requestedDates = datesParam ? datesParam.split(",").map(d => d.trim()).filter(Boolean) : [];
    
    // Get all accommodations if requested
    let accommodations: any[] = [];
    if (getAllAccommodations || !accommodationId) {
      const accSnapshot = await db.collection("accommodations")
        .where("status", "in", [true, "active"])
        .get();
      accommodations = accSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } else if (accommodationId) {
      const accDoc = await db.collection("accommodations").doc(accommodationId).get();
      if (accDoc.exists) {
        accommodations = [{ id: accDoc.id, ...accDoc.data() }];
      }
    }

    // Get all bookings
    let query: FirebaseFirestore.Query = db.collection("bookings")
      .where("status", "in", ["pending", "confirmed"]);

    const snapshot = await query.get();
    const bookings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    // Process bookings to get booked rooms per accommodation per date
    const bookingsByAccommodation: Record<string, Record<string, number>> = {};
    
    bookings.forEach((booking) => {
      const accId = booking.accommodationId;
      if (!accId) return;

      if (!bookingsByAccommodation[accId]) {
        bookingsByAccommodation[accId] = {};
      }

      // Support both old format (checkIn/checkOut) and new format (checkInDates)
      let bookingDates: string[] = [];
      
      if (booking.checkInDates && Array.isArray(booking.checkInDates)) {
        bookingDates = booking.checkInDates.map((d: any) => {
          if (typeof d === 'string') return d.split('T')[0];
          if (d?.toDate) return d.toDate().toISOString().split('T')[0];
          return new Date(d).toISOString().split('T')[0];
        });
      } else if (booking.checkIn && booking.checkOut) {
        const start = new Date(booking.checkIn);
        const end = new Date(booking.checkOut);
        const current = new Date(start);
        while (current < end) {
          bookingDates.push(current.toISOString().split('T')[0]);
          current.setDate(current.getDate() + 1);
        }
      }

      const roomsBooked = booking.numberOfRooms || 1;
      
      bookingDates.forEach((dateStr) => {
        if (!bookingsByAccommodation[accId][dateStr]) {
          bookingsByAccommodation[accId][dateStr] = 0;
        }
        bookingsByAccommodation[accId][dateStr] += roomsBooked;
      });
    });

    // If getAllAccommodations, return all accommodations with availability
    if (getAllAccommodations && requestedDates.length > 0) {
      const accommodationsWithAvailability = accommodations.map((acc) => {
        const totalRooms = acc.numberOfRooms || 1;
        const bookedRoomsByDate = bookingsByAccommodation[acc.id] || {};
        
        // Find minimum available rooms across all requested dates
        let minAvailableRooms = totalRooms;
        let allDatesAvailable = true;
        
        requestedDates.forEach((dateStr) => {
          const bookedRooms = bookedRoomsByDate[dateStr] || 0;
          const availableRooms = totalRooms - bookedRooms;
          if (availableRooms < minAvailableRooms) {
            minAvailableRooms = availableRooms;
          }
          if (availableRooms <= 0) {
            allDatesAvailable = false;
          }
        });

        return {
          ...acc,
          totalRooms,
          availableRooms: minAvailableRooms,
          bookedRooms: totalRooms - minAvailableRooms,
          isAvailable: minAvailableRooms > 0 && allDatesAvailable,
          availabilityByDate: requestedDates.reduce((acc, dateStr) => {
            const bookedRooms = bookedRoomsByDate[dateStr] || 0;
            acc[dateStr] = {
              bookedRooms,
              availableRooms: totalRooms - bookedRooms,
              available: (totalRooms - bookedRooms) > 0,
            };
            return acc;
          }, {} as Record<string, any>),
        };
      });

      return NextResponse.json({
        accommodations: accommodationsWithAvailability,
        requestedDates,
      });
    }

    // Original behavior: check specific accommodation
    if (accommodationId && requestedDates.length > 0) {
      const acc = accommodations.find((a) => a.id === accommodationId);
      if (!acc) {
        return NextResponse.json(
          { error: "Accommodation not found" },
          { status: 404 }
        );
      }

      const totalRooms = acc.numberOfRooms || 1;
      const bookedRoomsByDate = bookingsByAccommodation[accommodationId] || {};

      const availability: Record<string, { available: boolean; bookedRooms: number; availableRooms: number }> = {};
      const unavailableDates: string[] = [];

      requestedDates.forEach((dateStr) => {
        const bookedRooms = bookedRoomsByDate[dateStr] || 0;
        const availableRooms = totalRooms - bookedRooms;
        const available = availableRooms >= numberOfRooms;

        availability[dateStr] = {
          available,
          bookedRooms,
          availableRooms,
        };

        if (!available) {
          unavailableDates.push(dateStr);
        }
      });

      const bookedDates = Object.keys(bookedRoomsByDate).filter(
        date => bookedRoomsByDate[date] >= totalRooms
      );

      return NextResponse.json({
        available: unavailableDates.length === 0,
        availability,
        unavailableDates,
        totalRooms,
        requestedDates,
        bookedDates: [...new Set(bookedDates)],
      });
    }

    // For calendar display (no dates provided)
    const allBookedDates: string[] = [];
    Object.values(bookingsByAccommodation).forEach((bookedDates) => {
      Object.keys(bookedDates).forEach((date) => {
        allBookedDates.push(date);
      });
    });

    return NextResponse.json({
      bookedDates: [...new Set(allBookedDates)],
    });
  } catch (error: any) {
    console.error("Error checking availability:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check availability" },
      { status: 500 }
    );
  }
}
