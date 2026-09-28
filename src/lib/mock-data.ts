import {
  Project,
  PendingAction,
  Activity,
  DocumentPlaceholder,
  NotificationItem,
  TenderRecord,
  LoiLoaRecord,
  AcceptanceRecord,
  CpgRecord,
  AgreementRecord,
  Vendor,
  BoqItem,
  GtpRecord,
  PoRecord,
  InspectionCallRecord,
  InspectionOrderRecord,
  JirRecord,
  DiRecord,
  MiccRecord,
  ProgressiveBillRecord,
  FinalBillRecord,
} from '@/types';

// The production database and state must remain a CLEAN EMPTY STATE.
// DO NOT reintroduce Bongaigaon, Baksa, or any demo projects.

export const INITIAL_PROJECTS: Project[] = [];
export const INITIAL_PENDING_ACTIONS: PendingAction[] = [];
export const INITIAL_ACTIVITIES: Activity[] = [];
export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];
export const INITIAL_DOCUMENTS: DocumentPlaceholder[] = [];
export const INITIAL_TENDERS: TenderRecord[] = [];
export const INITIAL_LOI_LOAS: LoiLoaRecord[] = [];
export const INITIAL_ACCEPTANCES: AcceptanceRecord[] = [];
export const INITIAL_CPGS: CpgRecord[] = [];
export const INITIAL_AGREEMENTS: AgreementRecord[] = [];
export const INITIAL_VENDORS: Vendor[] = [];
export const INITIAL_BOQ_ITEMS: BoqItem[] = [];
export const INITIAL_GTPS: GtpRecord[] = [];
export const INITIAL_POS: PoRecord[] = [];
export const INITIAL_INSPECTION_CALLS: InspectionCallRecord[] = [];
export const INITIAL_INSPECTION_ORDERS: InspectionOrderRecord[] = [];
export const INITIAL_JIRS: JirRecord[] = [];
export const INITIAL_DIS: DiRecord[] = [];
export const INITIAL_MICCS: MiccRecord[] = [];
export const INITIAL_PROGRESSIVE_BILLS: ProgressiveBillRecord[] = [];
export const INITIAL_FINAL_BILLS: FinalBillRecord[] = [];
