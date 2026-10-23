/**
 * Application Enums for SQLite Compatibility & Engine Interop.
 *
 * Stored as TEXT (strings) in SQLite, but exposed as typed runtime enums
 * across the dispatch engine, compatibility matrix, seed scripts, and UI.
 */

export enum BloodGroup {
  A_POS = "A_POS",
  A_NEG = "A_NEG",
  B_POS = "B_POS",
  B_NEG = "B_NEG",
  AB_POS = "AB_POS",
  AB_NEG = "AB_NEG",
  O_POS = "O_POS",
  O_NEG = "O_NEG",
  BOMBAY_OH = "BOMBAY_OH",
}

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
}

export enum Component {
  WHOLE_BLOOD = "WHOLE_BLOOD",
  PRBC = "PRBC",
  PLASMA = "PLASMA",
  SDP = "SDP",
}

export enum RequestMode {
  REPLACEMENT_ANY = "REPLACEMENT_ANY",
  EXACT_OR_SDP = "EXACT_OR_SDP",
}

export enum WaveState {
  PENDING_VERIFICATION = "PENDING_VERIFICATION",
  STOCK_CHECK = "STOCK_CHECK",
  WAVE_1_DISPATCH = "WAVE_1_DISPATCH",
  WAVE_2_DISPATCH = "WAVE_2_DISPATCH",
  WAVE_3_DISPATCH = "WAVE_3_DISPATCH",
  LEASE_LOCKED = "LEASE_LOCKED",
  FULFILLED_CLOSED = "FULFILLED_CLOSED",
  EXPIRED = "EXPIRED",
}

export enum LeaseStatus {
  PINGED = "PINGED",
  JIT_PASSED = "JIT_PASSED",
  EN_ROUTE = "EN_ROUTE",
  ARRIVED = "ARRIVED",
  COMPLETED = "COMPLETED",
  EVICTED_TIMEOUT = "EVICTED_TIMEOUT",
  STANDBY = "STANDBY",
}

export enum ReferralStatus {
  PENDING = "PENDING",
  UNLOCKED = "UNLOCKED",
}

// Type aliases for loose string interoperability
export type BloodGroupType = `${BloodGroup}`;
export type GenderType = `${Gender}`;
export type ComponentType = `${Component}`;
export type RequestModeType = `${RequestMode}`;
export type WaveStateType = `${WaveState}`;
export type LeaseStatusType = `${LeaseStatus}`;
export type ReferralStatusType = `${ReferralStatus}`;
