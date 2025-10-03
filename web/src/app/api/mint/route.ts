import { APP_CONFIG, getGatewayUrl, getHostUrl } from "@/config/app";
import { getImageSizeErrorMessage, getImageTypeErrorMessage, isValidImageSize, isValidImageType } from "@/config/constants";
import { createAutoDriveApi } from "@autonomys/auto-drive";
import { Contract, JsonRpcProvider, Wallet } from "ethers";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export const POST = async (req: NextRequest) => {
  if (!process.env.AUTO_DRIVE_API_KEY)
    return NextResponse.json(
      { message: "AutoDrive API key is not set" },
      { status: 500 }
    );
  if (!APP_CONFIG.contract.address)
    return NextResponse.json(
      { message: "Contract address is not set" },
      { status: 500 }
    );

  // Check for server-side environment variables that must remain in env  
  if (!process.env.PRIVATE_KEY) {
    return NextResponse.json(
      { message: "Private key is not set" },
      { status: 500 }
    );
  }

  // Validate private key format (should be a 64-character hex string, optionally prefixed with 0x)
  const privateKey = process.env.PRIVATE_KEY.trim();
  if (!/^(0x)?[0-9a-fA-F]{64}$/.test(privateKey)) {
    return NextResponse.json(
      { message: "Private key has invalid format" },
      { status: 500 }
    );
  }


  try {
    const formData = await req.formData();
    console.log("Form Data:", formData);

    const name = formData.get("name") as string;
    const supply = parseInt(formData.get("supply") as string, 10);
    const description = formData.get("description") as string;
    const externalLink = formData.get("externalLink") as string;
    const media = formData.get("media") as File | null;
    const creator = formData.get("creator") as string;

    console.log("Received Data:", {
      name,
      supply,
      description,
      externalLink,
      media,
    });

    let mediaUrl = "";

    if (!media)
      return NextResponse.json(
        { message: "Media is required" },
        { status: 400 }
      );
    if (!isValidImageType(media.type))
      return NextResponse.json(
        { message: getImageTypeErrorMessage() },
        { status: 400 }
      );
    if (!isValidImageSize(media.size)) {
      return NextResponse.json(
        { message: getImageSizeErrorMessage() },
        { status: 400 }
      );
    }

    const arrayBuffer = await media.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Use mainnet storage (only supported network)
    const networkString = "mainnet";

    const driveClient = createAutoDriveApi({
      apiKey: process.env.AUTO_DRIVE_API_KEY!, 
      network: networkString
    });

    const uploadedFileCid = await driveClient.uploadFile(
      {
        read: async function* () {
          yield buffer;
        },
        name: media.name,
        mimeType: media.type,
        size: buffer.length,
      },
      {}
    );

    console.log("Final Upload Response:", uploadedFileCid);

    const imageCid = uploadedFileCid?.toString() || "";
    mediaUrl = getGatewayUrl(imageCid); // For response only

    // Set external_url to point to the user's NFT collection page
    const hostUrl = getHostUrl(req);
    const externalUrl = externalLink || `${hostUrl}/my-nfts`;

    const metadata = {
      description,
      external_url: externalUrl,
      image: mediaUrl,
      name,
      attributes: [],
    };
    console.log("Metadata:", metadata);

    const metadataBuffer = Buffer.from(JSON.stringify(metadata));
    const metadataUploadCid = await driveClient.uploadFile(
      {
        read: async function* () {
          yield metadataBuffer;
        },
        name: "metadata.json",
        mimeType: "application/json",
        size: metadataBuffer.length,
      },
      {}
    );

    const cid = metadataUploadCid?.toString() || "";

    console.log("Final Upload Response:", metadataUploadCid);

    // Now we need to mint the NFT
    const provider = new JsonRpcProvider(APP_CONFIG.evmNetwork.rpcUrl);
    const privateKey = process.env.PRIVATE_KEY!.trim();
    const wallet = new Wallet(privateKey, provider);
    const contract = new Contract(
      APP_CONFIG.contract.address,
      [
        {
          type: "function",
          name: "mint",
          inputs: [
            { name: "creator", type: "address", internalType: "address" },
            { name: "cid", type: "string", internalType: "string" },
            { name: "supply", type: "uint256", internalType: "uint256" },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
      ],
      wallet
    );
    const tx = await contract.mint(creator, cid, supply);

    const receipt = await tx.wait();
    console.log("Receipt:", receipt);

    return NextResponse.json(
      {
        message: "NFT created successfully",
        mediaUrl,
        txHash: tx.hash,
        cids: {
          image: uploadedFileCid?.toString(),
          metadata: metadataUploadCid?.toString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
};
