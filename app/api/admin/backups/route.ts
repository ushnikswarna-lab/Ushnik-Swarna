import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin, getFirestore } from "@/lib/firebase-admin";

// GET: List all backups
export async function GET() {
  try {
    const db = getFirestore();
    const snapshot = await db.collection("backups").orderBy("createdAt", "desc").get();

    const backups = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toMillis?.() || (data.createdAt ? new Date(data.createdAt).getTime() : Date.now()),
      };
    });

    return NextResponse.json(backups);
  } catch (error: any) {
    console.error("Error fetching backups:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch backups" },
      { status: 500 }
    );
  }
}

// POST: Create a new backup
export async function POST(request: NextRequest) {
  try {
    const admin = getFirebaseAdmin();
    const db = getFirestore();
    
    // Helper function to recursively get all documents including subcollections
    async function getAllDocuments(collectionRef: FirebaseFirestore.CollectionReference): Promise<any[]> {
      const documents: any[] = [];
      const snapshot = await collectionRef.get();
      
      for (const doc of snapshot.docs) {
        const docData: any = {
          id: doc.id,
          ...doc.data(),
        };
        
        // Get all subcollections for this document
        const subcollections = await doc.ref.listCollections();
        if (subcollections.length > 0) {
          docData._subcollections = {};
          for (const subcol of subcollections) {
            const subDocs = await getAllDocuments(subcol);
            if (subDocs.length > 0) {
              docData._subcollections[subcol.id] = subDocs;
            }
          }
        }
        
        documents.push(docData);
      }
      
      return documents;
    }
    
    // Helper function to discover all collections dynamically
    // Since Firestore Admin SDK doesn't provide a direct way to list collections,
    // we use a smart discovery method by attempting to read from collections
    async function getAllCollections(): Promise<string[]> {
      const collections: Set<string> = new Set();
      
      // Method 1: Try to discover collections by reading from root documents
      // We'll use a recursive approach to find all collections
      async function discoverCollectionsFromDocs(
        collectionRef: FirebaseFirestore.CollectionReference,
        depth: number = 0
      ): Promise<void> {
        if (depth > 3) return; // Limit depth to avoid infinite recursion
        
        try {
          const snapshot = await collectionRef.limit(1).get();
          // If we can read from this collection, it exists
          const collectionName = collectionRef.id;
          if (!collections.has(collectionName)) {
            collections.add(collectionName);
          }
          
          // Check subcollections from documents
          for (const doc of snapshot.docs) {
            const subcollections = await doc.ref.listCollections();
            for (const subcol of subcollections) {
              await discoverCollectionsFromDocs(subcol, depth + 1);
            }
          }
        } catch (error) {
          // Collection might not exist or we can't access it
        }
      }
      
      // Method 2: Try common collection patterns
      // We'll attempt to read from a wide range of potential collection names
      const commonPatterns = [
        // Known collections
        'users', 'products', 'producttypes', 'productTypes',
        'services', 'solutions', 'solutiontypes', 'solutionTypes',
        'industries', 'clients', 'vendors', 'careers',
        'newsletter',
        'backups', 'analytics', 'settings', 'config',
        // Additional potential collections
        'pages', 'posts', 'categories', 'tags', 'comments',
        'orders', 'transactions', 'notifications', 'logs',
      ];
      
      // Try each potential collection
      const discoveryPromises = commonPatterns.map(async (colName) => {
        try {
          const testRef = db.collection(colName);
          const testSnapshot = await testRef.limit(1).get();
          // Collection exists if we can read from it (even if empty)
          collections.add(colName);
          // Also discover subcollections
          for (const doc of testSnapshot.docs) {
            const subcollections = await doc.ref.listCollections();
            for (const subcol of subcollections) {
              await discoverCollectionsFromDocs(subcol, 1);
            }
          }
        } catch (error) {
          // Collection doesn't exist or we can't access it - skip
        }
      });
      
      await Promise.all(discoveryPromises);
      
      // Method 3: If we have any documents, try to discover collections from their paths
      // This is a fallback to catch any collections we might have missed
      try {
        // Try to get a sample of documents from known collections to discover related collections
        const knownCollections = Array.from(collections);
        for (const colName of knownCollections) {
          try {
            const sampleRef = db.collection(colName);
            const sampleSnapshot = await sampleRef.limit(10).get();
            for (const doc of sampleSnapshot.docs) {
              const subcollections = await doc.ref.listCollections();
              for (const subcol of subcollections) {
                collections.add(subcol.id);
              }
            }
          } catch (error) {
            // Skip if we can't read
          }
        }
      } catch (error) {
        // Continue even if this fails
      }
      
      return Array.from(collections);
    }

    const backupData: Record<string, any> = {};
    const timestamp = new Date().toISOString();

    // Dynamically discover all collections
    let collections: string[] = [];
    try {
      collections = await getAllCollections();
      console.log(`Discovered ${collections.length} collections:`, collections);
    } catch (error: any) {
      console.error('Error discovering collections:', error);
      // If discovery fails, return error
      return NextResponse.json(
        { error: `Failed to discover collections: ${error.message}` },
        { status: 500 }
      );
    }

    // Fetch all documents from each discovered collection (including subcollections)
    for (const collectionName of collections) {
      try {
        const collectionRef = db.collection(collectionName);
        const documents = await getAllDocuments(collectionRef);
        if (documents.length > 0 || collectionName === 'backups') {
          // Include collection even if empty (for backups collection)
          backupData[collectionName] = documents;
        }
      } catch (error: any) {
        console.error(`Error fetching collection ${collectionName}:`, error);
        backupData[collectionName] = [];
      }
    }

    // Convert to JSON string
    const jsonString = JSON.stringify(backupData, null, 2);
    const jsonBuffer = Buffer.from(jsonString, "utf-8");
    const base64 = jsonBuffer.toString("base64");
    const dataUri = `data:application/json;base64,${base64}`;

    // Upload to Cloudinary
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      return NextResponse.json(
        { error: "Cloudinary configuration is missing" },
        { status: 500 }
      );
    }

    // Use FormData for raw file upload
    const formData = new FormData();
    formData.append("file", dataUri);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", "backups");
    formData.append("resource_type", "raw");
    formData.append("public_id", `backup_${Date.now()}`);

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json().catch(() => ({ error: { message: "Unknown error" } }));
      throw new Error(errorData.error?.message || "Failed to upload backup to Cloudinary");
    }

    const uploadResult = await uploadResponse.json();
    const fileName = `backup_${Date.now()}.json`;

    // Save backup metadata to Firestore
    const backupDoc = {
      fileName,
      cloudinaryUrl: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
      size: jsonString.length,
      collections: Object.keys(backupData),
      documentCount: Object.values(backupData).reduce((sum, docs) => sum + docs.length, 0),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: "system",
    };

    const backupRef = await db.collection("backups").add(backupDoc);
    const savedBackup = await backupRef.get();

    return NextResponse.json({
      id: backupRef.id,
      ...savedBackup.data(),
      createdAt: savedBackup.data()?.createdAt?.toMillis?.() || Date.now(),
    });
  } catch (error: any) {
    console.error("Error creating backup:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create backup" },
      { status: 500 }
    );
  }
}
