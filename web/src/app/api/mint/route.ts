import { APP_CONFIG } from "@/config/app";
import { getStorageUrl } from "@/config/constants";
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
    const body = await req.json();
    console.log("Request body:", body);

    const { name, supply, description, externalLink, creator, imageCid } = body;

    if (!name || !supply || !description || !creator || !imageCid) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("Received Data:", {
      name,
      supply,
      description,
      externalLink,
      creator,
      imageCid,
    });

    const storageNetworkName = APP_CONFIG.storage.networkName;
    const mediaUrl = getStorageUrl(imageCid); // For response only

    // Create Auto-Drive client for metadata upload
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

    const metadata = {
      description,
      external_url: externalLink,
      image: `${storageNetworkName}:${imageCid}`, // Store network:cid format
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
          image: imageCid,
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
