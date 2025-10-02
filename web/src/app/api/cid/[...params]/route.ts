import { createAutoDriveApi } from "@autonomys/auto-drive";
import { NextRequest, NextResponse } from "next/server";

const detectFileType = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  const bytes = [...new Uint8Array(arrayBuffer.slice(0, 4))]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();

  // File type magic numbers and corresponding types
  const magicNumbers = {
    "89504E47": "image/png",
    FFD8FFE0: "image/jpeg",
    FFD8FFE1: "image/jpeg",
    FFD8FFE2: "image/jpeg",
    FFD8FFE3: "image/jpeg",
    FFD8FFE8: "image/jpeg",
    FFD8FFDB: "image/jpeg",
    FFD8FFEE: "image/jpeg",
    "47494638": "image/gif",
    "3C3F786D": "image/svg+xml",
    "3C737667": "image/svg+xml",
    "424D": "image/bmp",
    "49492A00": "image/tiff",
    "4D4D002A": "image/tiff",
    "00000100": "image/x-icon",
  };

  for (const [signature, type] of Object.entries(magicNumbers)) {
    if (bytes.startsWith(signature)) {
      return type;
    }
  }

  return "unknown";
};

async function fetchFromAutoDrive(cid: string) {
  const apiKey = process.env.AUTO_DRIVE_API_KEY;
  if (!apiKey) {
    throw new Error("AUTO_DRIVE_API_KEY is not set");
  }
  
  try {
    const api = createAutoDriveApi({
      apiKey,
      network: "mainnet"
    });
    
    const stream = await api.downloadFile(cid);
    
    let file = Buffer.alloc(0);
    for await (const chunk of stream) {
      file = Buffer.concat([file, chunk]);
    }
    
    return file;
  } catch (error) {
    console.error("AutoDrive download failed:", {
      message: error instanceof Error ? error.message : String(error),
      cid,
      network: "mainnet"
    });
    throw new Error(`AutoDrive download failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function GET(req: NextRequest) {
  try {
    const pathname = req.nextUrl.pathname;
    
    // For URL /api/cid/bafkr6igbtskqntm5crr4danp6wkp4kkt4vgwufwfxxrwjiog4qiijkwfoi
    // Split gives: ["", "api", "cid", "bafkr6igbtskqntm5crr4danp6wkp4kkt4vgwufwfxxrwjiog4qiijkwfoi"]
    const pathParts = pathname.split("/");
    const cid = pathParts[3]; // the actual CID
    
    if (!cid) {
      return NextResponse.json({ error: "CID is required" }, { status: 400 });
    }

    const fileBuffer = await fetchFromAutoDrive(cid);
    
    //@ts-expect-error - fileBuffer is a Buffer
    const fileType = await detectFileType(fileBuffer);

    // Check file size for caching decisions
    const fileSizeBytes = fileBuffer.length;
    const isLargeFile = fileSizeBytes > 2 * 1024 * 1024; // 2MB threshold
    const isAnimatedGif = fileType === "image/gif";

    // Try to parse as JSON first
    try {
      const jsonString = fileBuffer.toString("utf-8");
      const parsedJson = JSON.parse(jsonString);
      return NextResponse.json(parsedJson);
    } catch {
      // If not JSON, treat as file/image
      const headers: Record<string, string> = {
        "Content-Type": fileType,
      };

      // Add cache control headers for large files or animated GIFs
      if (isLargeFile || isAnimatedGif) {
        headers["Cache-Control"] = "public, max-age=31536000, immutable"; // Cache for 1 year but let browser handle
        headers["X-Large-File"] = "true";
      }

      // Add specific headers for animated GIFs
      if (isAnimatedGif) {
        headers["X-Animated-GIF"] = "true";
      }

      if (fileType === "image/svg+xml") {
        return new NextResponse(fileBuffer.toString("utf-8"), {
          status: 200,
          headers,
        });
      } else {
        return new NextResponse(fileBuffer, {
          status: 200,
          headers,
        });
      }
    }
  } catch (error) {
    console.error("CID API - Error processing request:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
