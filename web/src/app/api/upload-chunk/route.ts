import { APP_CONFIG, getImageSizeErrorMessage, getImageTypeErrorMessage, isValidImageSize, isValidImageType } from "@/config/constants";
import { createAutoDriveApi } from "@autonomys/auto-drive";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

// Store chunks in memory (in production, you'd use Redis or similar)
interface ChunkMetadata {
  fileName: string;
  fileType: string;
  fileSize: number;
}

const chunkStore = new Map<string, { chunks: Buffer[], totalChunks: number, metadata: ChunkMetadata }>();

export const POST = async (req: NextRequest) => {
  if (!process.env.AUTO_DRIVE_API_KEY) {
    return NextResponse.json(
      { message: "AutoDrive API key is not set" },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    
    const chunk = formData.get("chunk") as File;
    const chunkIndex = parseInt(formData.get("chunkIndex") as string);
    const totalChunks = parseInt(formData.get("totalChunks") as string);
    const uploadId = formData.get("uploadId") as string;
    const fileName = formData.get("fileName") as string;
    const fileType = formData.get("fileType") as string;
    const fileSize = parseInt(formData.get("fileSize") as string);

    if (!chunk || !uploadId || !fileName || !fileType || isNaN(chunkIndex) || isNaN(totalChunks) || isNaN(fileSize)) {
      return NextResponse.json(
        { message: "Missing or invalid required fields" },
        { status: 400 }
      );
    }

    // Validate chunk index bounds
    if (chunkIndex < 0 || chunkIndex >= totalChunks) {
      return NextResponse.json(
        { message: `Invalid chunk index: ${chunkIndex} (expected 0-${totalChunks - 1})` },
        { status: 400 }
      );
    }

    // Validate file type and size (only on first chunk)
    if (chunkIndex === 0) {
      if (!isValidImageType(fileType)) {
        return NextResponse.json(
          { message: getImageTypeErrorMessage() },
          { status: 400 }
        );
      }

      if (!isValidImageSize(fileSize)) {
        return NextResponse.json(
          { message: getImageSizeErrorMessage() },
          { status: 400 }
        );
      }
    }

    // Convert chunk to buffer
    let chunkBuffer: Buffer;
    try {
      const arrayBuffer = await chunk.arrayBuffer();
      chunkBuffer = Buffer.from(arrayBuffer);
    } catch (error) {
      console.error(`Error converting chunk ${chunkIndex} to buffer:`, error);
      return NextResponse.json(
        { message: "Failed to process chunk data" },
        { status: 400 }
      );
    }

    // Store chunk
    if (!chunkStore.has(uploadId)) {
      chunkStore.set(uploadId, { 
        chunks: new Array(totalChunks), 
        totalChunks,
        metadata: { fileName, fileType, fileSize }
      });
    }

    const uploadData = chunkStore.get(uploadId)!;
    uploadData.chunks[chunkIndex] = chunkBuffer;

    // Check if all chunks are received
    const receivedCount = uploadData.chunks.filter(chunk => chunk !== undefined).length;
    const allChunksReceived = receivedCount === totalChunks;

    if (allChunksReceived) {
      // Reassemble the file (filter out any undefined chunks as safety measure)
      const validChunks = uploadData.chunks.filter(chunk => chunk !== undefined);
      
      if (validChunks.length !== totalChunks) {
        return NextResponse.json(
          { message: `Missing chunks: expected ${totalChunks}, got ${validChunks.length}` },
          { status: 400 }
        );
      }
      
      const fullFile = Buffer.concat(validChunks);
      
      // Upload to Auto-Drive
      const storageNetworkName = APP_CONFIG.storage.networkName;
      let networkString: "taurus" | "mainnet";
      if (storageNetworkName === "taurus") {
        networkString = "taurus";
      } else if (storageNetworkName === "mainnet") {
        networkString = "mainnet";
      } else {
        return NextResponse.json(
          { message: `Invalid storage network: ${storageNetworkName}` },
          { status: 500 }
        );
      }

      const driveClient = createAutoDriveApi({
        apiKey: process.env.AUTO_DRIVE_API_KEY!,
        network: networkString
      });

      const uploadedFileCid = await driveClient.uploadFile(
        {
          read: async function* () {
            yield fullFile;
          },
          name: fileName,
          mimeType: fileType,
          size: fullFile.length,
        },
        {}
      );

      // Clean up chunks from memory
      chunkStore.delete(uploadId);
      
      return NextResponse.json({
        message: "File uploaded successfully",
        cid: uploadedFileCid?.toString() || "",
        complete: true
      }, { status: 200 });
    } else {
      return NextResponse.json({
        message: "Chunk received",
        chunkIndex,
        totalChunks,
        complete: false
      }, { status: 200 });
    }

  } catch (error) {
    console.error("Error processing chunk:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}; 