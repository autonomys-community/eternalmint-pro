import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  ApprovalForAll,
  BatchDistribution,
  NftMinted,
  RoleAdminChanged,
  RoleGranted,
  RoleRevoked,
  SingleDistribution,
  TransferBatch,
  TransferSingle,
  URI
} from "../generated/EternalMintNfts/EternalMintNfts"

export function createApprovalForAllEvent(
  account: Address,
  operator: Address,
  approved: boolean
): ApprovalForAll {
  let approvalForAllEvent = changetype<ApprovalForAll>(newMockEvent())

  approvalForAllEvent.parameters = new Array()

  approvalForAllEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  approvalForAllEvent.parameters.push(
    new ethereum.EventParam("operator", ethereum.Value.fromAddress(operator))
  )
  approvalForAllEvent.parameters.push(
    new ethereum.EventParam("approved", ethereum.Value.fromBoolean(approved))
  )

  return approvalForAllEvent
}

export function createBatchDistributionEvent(
  distributor: Address,
  tokenIds: Array<BigInt>,
  recipients: Array<Address>,
  amounts: Array<BigInt>,
  timestamp: BigInt
): BatchDistribution {
  let batchDistributionEvent = changetype<BatchDistribution>(newMockEvent())

  batchDistributionEvent.parameters = new Array()

  batchDistributionEvent.parameters.push(
    new ethereum.EventParam(
      "distributor",
      ethereum.Value.fromAddress(distributor)
    )
  )
  batchDistributionEvent.parameters.push(
    new ethereum.EventParam(
      "tokenIds",
      ethereum.Value.fromUnsignedBigIntArray(tokenIds)
    )
  )
  batchDistributionEvent.parameters.push(
    new ethereum.EventParam(
      "recipients",
      ethereum.Value.fromAddressArray(recipients)
    )
  )
  batchDistributionEvent.parameters.push(
    new ethereum.EventParam(
      "amounts",
      ethereum.Value.fromUnsignedBigIntArray(amounts)
    )
  )
  batchDistributionEvent.parameters.push(
    new ethereum.EventParam(
      "timestamp",
      ethereum.Value.fromUnsignedBigInt(timestamp)
    )
  )

  return batchDistributionEvent
}

export function createNftMintedEvent(
  creator: Address,
  tokenId: BigInt,
  supply: BigInt,
  cid: string
): NftMinted {
  let nftMintedEvent = changetype<NftMinted>(newMockEvent())

  nftMintedEvent.parameters = new Array()

  nftMintedEvent.parameters.push(
    new ethereum.EventParam("creator", ethereum.Value.fromAddress(creator))
  )
  nftMintedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  nftMintedEvent.parameters.push(
    new ethereum.EventParam("supply", ethereum.Value.fromUnsignedBigInt(supply))
  )
  nftMintedEvent.parameters.push(
    new ethereum.EventParam("cid", ethereum.Value.fromString(cid))
  )

  return nftMintedEvent
}

export function createRoleAdminChangedEvent(
  role: Bytes,
  previousAdminRole: Bytes,
  newAdminRole: Bytes
): RoleAdminChanged {
  let roleAdminChangedEvent = changetype<RoleAdminChanged>(newMockEvent())

  roleAdminChangedEvent.parameters = new Array()

  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "previousAdminRole",
      ethereum.Value.fromFixedBytes(previousAdminRole)
    )
  )
  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newAdminRole",
      ethereum.Value.fromFixedBytes(newAdminRole)
    )
  )

  return roleAdminChangedEvent
}

export function createRoleGrantedEvent(
  role: Bytes,
  account: Address,
  sender: Address
): RoleGranted {
  let roleGrantedEvent = changetype<RoleGranted>(newMockEvent())

  roleGrantedEvent.parameters = new Array()

  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )

  return roleGrantedEvent
}

export function createRoleRevokedEvent(
  role: Bytes,
  account: Address,
  sender: Address
): RoleRevoked {
  let roleRevokedEvent = changetype<RoleRevoked>(newMockEvent())

  roleRevokedEvent.parameters = new Array()

  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )

  return roleRevokedEvent
}

export function createSingleDistributionEvent(
  distributor: Address,
  tokenId: BigInt,
  recipient: Address,
  amount: BigInt,
  timestamp: BigInt
): SingleDistribution {
  let singleDistributionEvent = changetype<SingleDistribution>(newMockEvent())

  singleDistributionEvent.parameters = new Array()

  singleDistributionEvent.parameters.push(
    new ethereum.EventParam(
      "distributor",
      ethereum.Value.fromAddress(distributor)
    )
  )
  singleDistributionEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  singleDistributionEvent.parameters.push(
    new ethereum.EventParam("recipient", ethereum.Value.fromAddress(recipient))
  )
  singleDistributionEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  singleDistributionEvent.parameters.push(
    new ethereum.EventParam(
      "timestamp",
      ethereum.Value.fromUnsignedBigInt(timestamp)
    )
  )

  return singleDistributionEvent
}

export function createTransferBatchEvent(
  operator: Address,
  from: Address,
  to: Address,
  ids: Array<BigInt>,
  values: Array<BigInt>
): TransferBatch {
  let transferBatchEvent = changetype<TransferBatch>(newMockEvent())

  transferBatchEvent.parameters = new Array()

  transferBatchEvent.parameters.push(
    new ethereum.EventParam("operator", ethereum.Value.fromAddress(operator))
  )
  transferBatchEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  transferBatchEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  transferBatchEvent.parameters.push(
    new ethereum.EventParam("ids", ethereum.Value.fromUnsignedBigIntArray(ids))
  )
  transferBatchEvent.parameters.push(
    new ethereum.EventParam(
      "values",
      ethereum.Value.fromUnsignedBigIntArray(values)
    )
  )

  return transferBatchEvent
}

export function createTransferSingleEvent(
  operator: Address,
  from: Address,
  to: Address,
  id: BigInt,
  value: BigInt
): TransferSingle {
  let transferSingleEvent = changetype<TransferSingle>(newMockEvent())

  transferSingleEvent.parameters = new Array()

  transferSingleEvent.parameters.push(
    new ethereum.EventParam("operator", ethereum.Value.fromAddress(operator))
  )
  transferSingleEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  transferSingleEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  transferSingleEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromUnsignedBigInt(id))
  )
  transferSingleEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value))
  )

  return transferSingleEvent
}

export function createURIEvent(value: string, id: BigInt): URI {
  let uriEvent = changetype<URI>(newMockEvent())

  uriEvent.parameters = new Array()

  uriEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromString(value))
  )
  uriEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromUnsignedBigInt(id))
  )

  return uriEvent
}
