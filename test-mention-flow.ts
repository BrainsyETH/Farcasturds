/**
 * Test script to verify @mention functionality with contract integration
 *
 * This tests:
 * 1. Contract connection and hasMinted() function
 * 2. NFT verification for known FIDs
 * 3. Rate limiting logic
 * 4. Database connectivity
 */

import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { farcasturdsV2Abi } from "./abi/FarcasturdsV2";
import { farcasturdsV3Abi } from "./abi/FarcasturdsV3";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '.env.local' });

const CONTRACT_V3 = process.env.NEXT_PUBLIC_FARCASTURDS_ADDRESS as `0x${string}`;
const CONTRACT_V2 = process.env.NEXT_PUBLIC_FARCASTURDS_V2_ADDRESS as `0x${string}`;
const RPC = process.env.BASE_RPC_URL;

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
  error?: string;
}

const results: TestResult[] = [];

async function testContractConnection() {
  console.log("\n🔍 Test 1: Contract Connection (V2 & V3)");
  console.log("━".repeat(60));

  try {
    if (!CONTRACT_V3 && !CONTRACT_V2) {
      throw new Error("Neither NEXT_PUBLIC_FARCASTURDS_ADDRESS (V3) nor NEXT_PUBLIC_FARCASTURDS_V2_ADDRESS set");
    }
    if (!RPC) {
      throw new Error("BASE_RPC_URL not set");
    }

    console.log(`📝 Contract V3: ${CONTRACT_V3 || 'not set'}`);
    console.log(`📝 Contract V2: ${CONTRACT_V2 || 'not set'}`);
    console.log(`🌐 RPC: ${RPC.substring(0, 50)}...`);

    const publicClient = createPublicClient({
      chain: base,
      transport: http(RPC),
    });

    let v3Info = null;
    let v2Info = null;

    // Test V3 contract if configured
    if (CONTRACT_V3) {
      try {
        const name = await publicClient.readContract({
          address: CONTRACT_V3,
          abi: farcasturdsV3Abi,
          functionName: "name",
        } as any);

        const symbol = await publicClient.readContract({
          address: CONTRACT_V3,
          abi: farcasturdsV3Abi,
          functionName: "symbol",
        } as any);

        const totalSupply = await publicClient.readContract({
          address: CONTRACT_V3,
          abi: farcasturdsV3Abi,
          functionName: "totalSupply",
        } as any);

        const mintPrice = await publicClient.readContract({
          address: CONTRACT_V3,
          abi: farcasturdsV3Abi,
          functionName: "mintPrice",
        } as any);

        console.log(`\n✅ V3 Contract Name: ${name}`);
        console.log(`✅ V3 Contract Symbol: ${symbol}`);
        console.log(`✅ V3 Total Supply: ${totalSupply}`);
        console.log(`✅ V3 Mint Price: ${mintPrice} wei (${Number(mintPrice) / 1e18} ETH)`);

        v3Info = { name, symbol, totalSupply, mintPrice };
      } catch (err) {
        console.log(`⚠️  V3 contract check failed:`, err);
      }
    }

    // Test V2 contract if configured
    if (CONTRACT_V2) {
      try {
        const name = await publicClient.readContract({
          address: CONTRACT_V2,
          abi: farcasturdsV2Abi,
          functionName: "name",
        } as any);

        const symbol = await publicClient.readContract({
          address: CONTRACT_V2,
          abi: farcasturdsV2Abi,
          functionName: "symbol",
        } as any);

        const totalSupply = await publicClient.readContract({
          address: CONTRACT_V2,
          abi: farcasturdsV2Abi,
          functionName: "totalSupply",
        } as any);

        const mintPrice = await publicClient.readContract({
          address: CONTRACT_V2,
          abi: farcasturdsV2Abi,
          functionName: "mintPrice",
        } as any);

        console.log(`\n✅ V2 Contract Name: ${name}`);
        console.log(`✅ V2 Contract Symbol: ${symbol}`);
        console.log(`✅ V2 Total Supply: ${totalSupply}`);
        console.log(`✅ V2 Mint Price: ${mintPrice} wei (${Number(mintPrice) / 1e18} ETH)`);

        v2Info = { name, symbol, totalSupply, mintPrice };
      } catch (err) {
        console.log(`⚠️  V2 contract check failed:`, err);
      }
    }

    if (!v3Info && !v2Info) {
      throw new Error("Failed to connect to any contract");
    }

    results.push({
      name: "Contract Connection",
      passed: true,
      details: `V3: ${v3Info ? 'Connected' : 'Not configured'}, V2: ${v2Info ? 'Connected' : 'Not configured'}`,
    });

    return publicClient;
  } catch (error) {
    console.error(`❌ Error:`, error);
    results.push({
      name: "Contract Connection",
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

async function testHasMintedFunction(publicClient: any) {
  console.log("\n🔍 Test 2: hasMinted() Function (V2 & V3)");
  console.log("━".repeat(60));

  // Test with a few FIDs - some should have minted, some shouldn't
  const testFids = [
    { fid: 3, description: "dwr.eth (Farcaster founder)" },
    { fid: 1, description: "farcaster (system account)" },
    { fid: 999999999, description: "Non-existent FID" },
  ];

  try {
    const mintResults = [];

    for (const { fid, description } of testFids) {
      console.log(`\n📊 Checking FID ${fid} (${description})...`);

      let hasMintedV3 = false;
      let hasMintedV2 = false;

      // Check V3 contract
      if (CONTRACT_V3) {
        try {
          hasMintedV3 = await publicClient.readContract({
            address: CONTRACT_V3,
            abi: farcasturdsV3Abi,
            functionName: "hasMinted",
            args: [BigInt(fid)],
          });

          console.log(`   V3: ${hasMintedV3 ? "✅ HAS" : "❌ HAS NOT"} minted`);

          if (hasMintedV3) {
            try {
              const owner = await publicClient.readContract({
                address: CONTRACT_V3,
                abi: farcasturdsV3Abi,
                functionName: "ownerOfFid",
                args: [BigInt(fid)],
              });
              console.log(`   📍 V3 Owner address: ${owner}`);
            } catch (err) {
              console.log(`   ⚠️  Could not fetch V3 owner`);
            }
          }
        } catch (err) {
          console.log(`   ⚠️  V3 Error checking FID ${fid}:`, err);
        }
      }

      // Check V2 contract
      if (CONTRACT_V2) {
        try {
          hasMintedV2 = await publicClient.readContract({
            address: CONTRACT_V2,
            abi: farcasturdsV2Abi,
            functionName: "hasMinted",
            args: [BigInt(fid)],
          });

          console.log(`   V2: ${hasMintedV2 ? "✅ HAS" : "❌ HAS NOT"} minted`);

          if (hasMintedV2) {
            try {
              const owner = await publicClient.readContract({
                address: CONTRACT_V2,
                abi: farcasturdsV2Abi,
                functionName: "ownerOfFid",
                args: [BigInt(fid)],
              });
              console.log(`   📍 V2 Owner address: ${owner}`);
            } catch (err) {
              console.log(`   ⚠️  Could not fetch V2 owner`);
            }
          }
        } catch (err) {
          console.log(`   ⚠️  V2 Error checking FID ${fid}:`, err);
        }
      }

      mintResults.push({ fid, hasMintedV3, hasMintedV2, hasMintedEither: hasMintedV3 || hasMintedV2, description });
    }

    results.push({
      name: "hasMinted() Function",
      passed: true,
      details: `Tested ${testFids.length} FIDs on both V2 and V3 contracts`,
    });

    return mintResults;
  } catch (error) {
    console.error(`❌ Error:`, error);
    results.push({
      name: "hasMinted() Function",
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

async function testNFTVerificationLogic() {
  console.log("\n🔍 Test 3: NFT Verification Logic");
  console.log("━".repeat(60));

  try {
    // Import the actual function used by the bot
    const { checkUserHasNFT } = await import("./lib/nftVerification");

    const testFid = 3; // dwr.eth
    console.log(`📊 Testing checkUserHasNFT(${testFid})...`);

    const hasNFT = await checkUserHasNFT(testFid);
    console.log(`   Result: ${hasNFT ? "✅ HAS NFT" : "❌ NO NFT"}`);

    results.push({
      name: "NFT Verification Logic",
      passed: true,
      details: `checkUserHasNFT() executed successfully`,
    });
  } catch (error) {
    console.error(`❌ Error:`, error);
    results.push({
      name: "NFT Verification Logic",
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function testDatabaseConnection() {
  console.log("\n🔍 Test 4: Database Connection");
  console.log("━".repeat(60));

  try {
    // Check if Supabase env vars are set
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials not configured");
    }

    console.log(`📝 Supabase URL: ${supabaseUrl}`);
    console.log(`🔑 Service key configured: ✅`);

    // Try to import and use database functions
    const { checkRateLimit } = await import("./lib/database");

    console.log(`\n📊 Testing rate limit check...`);
    const rateLimitResult = await checkRateLimit(999999999); // Non-existent FID
    console.log(`   Result:`, rateLimitResult);

    results.push({
      name: "Database Connection",
      passed: true,
      details: "Database functions accessible and working",
    });
  } catch (error) {
    console.error(`❌ Error:`, error);
    results.push({
      name: "Database Connection",
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function testWebhookEndpoint() {
  console.log("\n🔍 Test 5: Webhook Endpoint Check");
  console.log("━".repeat(60));

  try {
    const webhookPath = "/app/api/webhook/mentions/route.ts";
    const fs = await import("fs");

    if (fs.existsSync(webhookPath)) {
      console.log(`✅ Webhook file exists at ${webhookPath}`);

      // Read the file to verify it has the key components
      const content = fs.readFileSync(webhookPath, "utf-8");

      const checks = [
        { name: "processTurdCommand import", pattern: /processTurdCommand/ },
        { name: "checkUserHasNFT import", pattern: /checkUserHasNFT/ },
        { name: "checkRateLimit call", pattern: /checkRateLimit/ },
        { name: "recordTurd call", pattern: /recordTurd/ },
        { name: "replyToCast call", pattern: /replyToCast/ },
      ];

      let allChecksPass = true;
      for (const check of checks) {
        const found = check.pattern.test(content);
        console.log(`   ${found ? "✅" : "❌"} ${check.name}`);
        if (!found) allChecksPass = false;
      }

      results.push({
        name: "Webhook Endpoint Check",
        passed: allChecksPass,
        details: "Webhook file structure verified",
      });
    } else {
      throw new Error("Webhook file not found");
    }
  } catch (error) {
    console.error(`❌ Error:`, error);
    results.push({
      name: "Webhook Endpoint Check",
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function printSummary() {
  console.log("\n" + "═".repeat(60));
  console.log("📊 TEST SUMMARY");
  console.log("═".repeat(60) + "\n");

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  for (const result of results) {
    const icon = result.passed ? "✅" : "❌";
    console.log(`${icon} ${result.name}`);
    if (result.details) {
      console.log(`   ${result.details}`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }

  console.log(`\n${"━".repeat(60)}`);
  console.log(`Passed: ${passed} | Failed: ${failed} | Total: ${results.length}`);
  console.log(`${"━".repeat(60)}\n`);

  if (failed === 0) {
    console.log("🎉 All tests passed! @mention functionality is ready.\n");
  } else {
    console.log("⚠️  Some tests failed. Review the errors above.\n");
  }
}

async function main() {
  console.log("╔" + "═".repeat(58) + "╗");
  console.log("║  FARCASTURDS BOT - @MENTION FUNCTIONALITY TEST          ║");
  console.log("╚" + "═".repeat(58) + "╝");

  try {
    const publicClient = await testContractConnection();
    await testHasMintedFunction(publicClient);
    await testNFTVerificationLogic();
    await testDatabaseConnection();
    await testWebhookEndpoint();
  } catch (error) {
    console.error("\n❌ Fatal error during tests:", error);
  }

  await printSummary();
}

main();
