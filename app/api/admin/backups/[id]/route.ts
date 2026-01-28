import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";
import { getApps } from "firebase-admin/app";

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  if (serviceAccount.projectId && serviceAccount.privateKey && serviceAccount.clientEmail) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      });
    } catch (error) {
      console.error("Firebase Admin initialization error:", error);
    }
  } else {
    console.error("Firebase Admin credentials are missing. Please check your environment variables.");
  }
}

// GET: Download backup file
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!getApps().length) {
      return NextResponse.json(
        { error: "Firebase Admin not initialized" },
        { status: 500 }
      );
    }

    const { id } = await params;
    const db = admin.firestore();
    const backupDoc = await db.collection("backups").doc(id).get();

    if (!backupDoc.exists) {
      return NextResponse.json(
        { error: "Backup not found" },
        { status: 404 }
      );
    }

    const backupData = backupDoc.data();
    const cloudinaryUrl = backupData?.cloudinaryUrl;

    if (!cloudinaryUrl) {
      return NextResponse.json(
        { error: "Backup file URL not found" },
        { status: 404 }
      );
    }

    // Fetch the backup file from Cloudinary
    const fileResponse = await fetch(cloudinaryUrl);
    if (!fileResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch backup file" },
        { status: 500 }
      );
    }

    const fileContent = await fileResponse.text();
    const fileName = backupData?.fileName || `backup_${id}.json`;

    // Return the file as a download
    return new NextResponse(fileContent, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    console.error("Error downloading backup:", error);
    return NextResponse.json(
      { error: error.message || "Failed to download backup" },
      { status: 500 }
    );
  }
}

// POST: Restore backup
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!getApps().length) {
      return NextResponse.json(
        { error: "Firebase Admin not initialized" },
        { status: 500 }
      );
    }

    const { id } = await params;
    const db = admin.firestore();
    const backupDoc = await db.collection("backups").doc(id).get();

    if (!backupDoc.exists) {
      return NextResponse.json(
        { error: "Backup not found" },
        { status: 404 }
      );
    }

    const backupData = backupDoc.data();
    const cloudinaryUrl = backupData?.cloudinaryUrl;

    if (!cloudinaryUrl) {
      return NextResponse.json(
        { error: "Backup file URL not found" },
        { status: 404 }
      );
    }

    // Fetch the backup file from Cloudinary
    const fileResponse = await fetch(cloudinaryUrl);
    if (!fileResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch backup file" },
        { status: 500 }
      );
    }

    const fileContent = await fileResponse.text();
    const backupJson = JSON.parse(fileContent);

    // Helper function to restore a document and its subcollections
    async function restoreDocument(
      collectionName: string,
      docData: any,
      batch: admin.firestore.WriteBatch
    ): Promise<void> {
      const { id: docId, _subcollections, ...docFields } = docData;
      
            // Convert Timestamp objects if present
            const processedData = Object.entries(docFields).reduce((acc, [key, value]) => {
              // Handle Firestore Timestamp conversion
              if (value && typeof value === "object") {
                const val = value as any;
                if ("seconds" in val && "nanoseconds" in val) {
                  acc[key] = admin.firestore.Timestamp.fromMillis(
                    val.seconds * 1000 + Math.floor(val.nanoseconds / 1000000)
                  );
                } else if ("_seconds" in val) {
                  acc[key] = admin.firestore.Timestamp.fromMillis(
                    val._seconds * 1000 + Math.floor((val._nanoseconds || 0) / 1000000)
                  );
                } else {
                  acc[key] = value;
                }
              } else {
                acc[key] = value;
              }
              return acc;
            }, {} as Record<string, any>);

      const docRef = db.collection(collectionName).doc(docId);
      batch.set(docRef, processedData);
    }
    
    // Restore each collection
    const restoreResults: Record<string, { success: number; errors: number }> = {};

    for (const [collectionName, documents] of Object.entries(backupJson)) {
      if (!Array.isArray(documents)) continue;

      let successCount = 0;
      let errorCount = 0;

      // Process in batches of 500 (Firestore batch limit)
      const BATCH_SIZE = 500;
      for (let i = 0; i < documents.length; i += BATCH_SIZE) {
        const batch = db.batch();
        const batchDocs = documents.slice(i, i + BATCH_SIZE);

        for (const doc of batchDocs) {
          try {
            await restoreDocument(collectionName, doc, batch);
          } catch (error) {
            errorCount++;
            console.error(`Error processing document in ${collectionName}:`, error);
          }
        }

        try {
          await batch.commit();
          successCount += batchDocs.length;
          
          // Restore subcollections after main document is restored
          for (const doc of batchDocs) {
            if (doc._subcollections) {
              for (const [subcolName, subDocs] of Object.entries(doc._subcollections)) {
                if (Array.isArray(subDocs) && subDocs.length > 0) {
                  // Process subcollections in batches
                  for (let j = 0; j < subDocs.length; j += BATCH_SIZE) {
                    const subBatch = db.batch();
                    const subBatchDocs = subDocs.slice(j, j + BATCH_SIZE);
                    
                    for (const subDoc of subBatchDocs) {
                      try {
                        const { id: subDocId, _subcollections: nestedSubcols, ...subDocFields } = subDoc;
                        
                        // Convert Timestamp objects
                        const processedSubData = Object.entries(subDocFields).reduce((acc, [key, value]) => {
                          if (value && typeof value === "object") {
                            const val = value as any;
                            if ("seconds" in val && "nanoseconds" in val) {
                              acc[key] = admin.firestore.Timestamp.fromMillis(
                                val.seconds * 1000 + Math.floor(val.nanoseconds / 1000000)
                              );
                            } else if ("_seconds" in val) {
                              acc[key] = admin.firestore.Timestamp.fromMillis(
                                val._seconds * 1000 + Math.floor((val._nanoseconds || 0) / 1000000)
                              );
                            } else {
                              acc[key] = value;
                            }
                          } else {
                            acc[key] = value;
                          }
                          return acc;
                        }, {} as Record<string, any>);
                        
                        const parentDocRef = db.collection(collectionName).doc(doc.id);
                        const subDocRef = parentDocRef.collection(subcolName).doc(subDocId);
                        subBatch.set(subDocRef, processedSubData);
                      } catch (error) {
                        console.error(`Error processing subcollection document ${subcolName}:`, error);
                      }
                    }
                    
                    try {
                      await subBatch.commit();
                    } catch (error) {
                      console.error(`Error committing subcollection batch:`, error);
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          errorCount += batchDocs.length;
          console.error(`Error committing batch for ${collectionName}:`, error);
        }
      }

      restoreResults[collectionName] = { success: successCount, errors: errorCount };
    }

    // Record restore operation
    await db.collection("backups").doc(id).update({
      restoredAt: admin.firestore.FieldValue.serverTimestamp(),
      restoredBy: "system",
    });

    return NextResponse.json({
      message: "Backup restored successfully",
      results: restoreResults,
    });
  } catch (error: any) {
    console.error("Error restoring backup:", error);
    return NextResponse.json(
      { error: error.message || "Failed to restore backup" },
      { status: 500 }
    );
  }
}

// DELETE: Delete backup
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!getApps().length) {
      return NextResponse.json(
        { error: "Firebase Admin not initialized" },
        { status: 500 }
      );
    }

    const { id } = await params;
    const db = admin.firestore();
    const backupDoc = await db.collection("backups").doc(id).get();

    if (!backupDoc.exists) {
      return NextResponse.json(
        { error: "Backup not found" },
        { status: 404 }
      );
    }

    const backupData = backupDoc.data();
    const cloudinaryPublicId = backupData?.cloudinaryPublicId;

    // Delete from Cloudinary if public_id exists
    if (cloudinaryPublicId) {
      try {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;

        if (cloudName && apiKey && apiSecret) {
          const timestamp = Math.round(Date.now() / 1000);
          const signature = require("crypto")
            .createHash("sha1")
            .update(`public_id=${cloudinaryPublicId}&timestamp=${timestamp}${apiSecret}`)
            .digest("hex");

          await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/raw/destroy`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                public_id: cloudinaryPublicId,
                timestamp,
                api_key: apiKey,
                signature,
              }),
            }
          );
        }
      } catch (error) {
        console.error("Error deleting from Cloudinary:", error);
        // Continue with Firestore deletion even if Cloudinary deletion fails
      }
    }

    // Delete from Firestore
    await db.collection("backups").doc(id).delete();

    return NextResponse.json({ message: "Backup deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting backup:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete backup" },
      { status: 500 }
    );
  }
}


