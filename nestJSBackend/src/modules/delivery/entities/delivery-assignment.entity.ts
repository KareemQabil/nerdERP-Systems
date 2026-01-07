import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { DeliveryDriver } from './delivery-driver.entity';

/**
 * =============================================================================
 * DELIVERY ASSIGNMENT TYPES
 * =============================================================================
 */

/**
 * Assignment Status
 */
export enum AssignmentStatus {
  ASSIGNED = 'ASSIGNED',       // Assigned to driver, awaiting response
  ACCEPTED = 'ACCEPTED',       // Driver accepted the assignment
  DECLINED = 'DECLINED',       // Driver declined the assignment
  PICKED_UP = 'PICKED_UP',     // Driver picked up order from restaurant
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',  // Driver is on the way
  DELIVERED = 'DELIVERED',     // Order delivered
  FAILED = 'FAILED',           // Delivery failed (customer unreachable, etc.)
  CANCELLED = 'CANCELLED',     // Assignment cancelled
  COMPLETED = 'COMPLETED',     // Assignment fully completed
}

/**
 * Delivery Proof
 */
export interface DeliveryProof {
  photoUrl?: string;           // Photo of delivered order
  signatureUrl?: string;       // Customer signature
  customerNote?: string;       // Note from customer
  deliveredToPerson?: string;  // Name of person who received
  deliveredAtTime?: Date;      // Exact delivery time
}

/**
 * Trip Data
 */
export interface TripData {
  distanceKm: number;
  estimatedMinutes: number;
  actualMinutes: number;
  route?: string;              // Route taken (if tracked)
}

/**
 * Payment Collection (COD - Cash on Delivery)
 */
export interface PaymentCollection {
  amountCollected: number;
  amountPending: number;
  paymentMethod: 'CASH' | 'CARD' | 'STC_PAY' | 'OTHER';
  collectedAt?: Date;
  reference?: string;
  notes?: string;
}

/**
 * Decline Reason
 */
export enum DeclineReason {
  TOO_FAR = 'TOO_FAR',
  ALREADY_AT_CAPACITY = 'ALREADY_AT_CAPACITY',
  VEHICLE_ISSUE = 'VEHICLE_ISSUE',
  PERSONAL_EMERGENCY = 'PERSONAL_EMERGENCY',
  WEATHER_CONDITIONS = 'WEATHER_CONDITIONS',
  TRAFFIC_ISSUES = 'TRAFFIC_ISSUES',
  OTHER = 'OTHER',
}

/**
 * =============================================================================
 * ENTITY: DeliveryAssignment
 * =============================================================================
 *
 * Tracks driver order assignments and delivery history.
 *
 * Workflow:
 * 1. Order assigned to driver (ASSIGNED)
 * 2. Driver accepts assignment (ACCEPTED) or declines (DECLINED)
 * 3. Driver picks up order from restaurant (PICKED_UP)
 * 4. Driver out for delivery (OUT_FOR_DELIVERY)
 * 5. Order delivered (DELIVERED)
 * 6. Payment collected if COD (PaymentCollection)
 * 7. Assignment completed (COMPLETED)
 *
 * Features:
 * - Full audit trail of assignment lifecycle
 * - Delivery proof (photo, signature)
 * - Trip data (distance, time)
 * - COD payment collection tracking
 * - Decline reason tracking
 *
 * @example
 * {
 *   driverId: 'driver-uuid',
 *   orderId: 'order-uuid',
 *   zoneId: 'zone-a-uuid',
 *   status: 'OUT_FOR_DELIVERY',
 *   tripData: { distanceKm: 3.5, estimatedMinutes: 20, actualMinutes: 18 },
 *   paymentCollection: { amountCollected: 200, paymentMethod: 'CASH' }
 * }
 */
@Entity('delivery_assignments')
export class DeliveryAssignment extends AbstractEntity {
  // =========================================================================
  // DRIVER RELATIONSHIP
  // =========================================================================

  @ManyToOne(() => DeliveryDriver)
  @JoinColumn({ name: 'driver_id' })
  driver: DeliveryDriver;

  @Column({ name: 'driver_id' })
  driverId: string;

  /**
   * Driver name (denormalized for quick reference)
   */
  @Column({ name: 'driver_name' })
  driverName: string;

  // =========================================================================
  // ORDER & ZONE
  // =========================================================================

  /**
   * Assigned order ID
   */
  @Column({ name: 'order_id' })
  orderId: string;

  /**
   * Order number
   */
  @Column({ name: 'order_number' })
  orderNumber: string;

  /**
   * Delivery zone ID
   */
  @Column({ name: 'zone_id' })
  zoneId: string;

  /**
   * Zone code (denormalized)
   */
  @Column({ name: 'zone_code' })
  zoneCode: string;

  // =========================================================================
  // ASSIGNMENT STATUS
  // =========================================================================

  /**
   * Current assignment status
   */
  @Column({
    name: 'status',
    type: 'enum',
    enum: AssignmentStatus,
    default: AssignmentStatus.ASSIGNED,
  })
  status: AssignmentStatus;

  // =========================================================================
  // ASSIGNMENT TIMESTAMPS
  // =========================================================================

  /**
   * When order was assigned to driver
   */
  @Column({ name: 'assigned_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  assignedAt: Date;

  /**
   * When driver accepted the assignment
   */
  @Column({ name: 'accepted_at', type: 'timestamp with time zone', nullable: true })
  acceptedAt: Date;

  /**
   * When driver declined the assignment
   */
  @Column({ name: 'declined_at', type: 'timestamp with time zone', nullable: true })
  declinedAt: Date;

  /**
   * When driver picked up order
   */
  @Column({ name: 'picked_up_at', type: 'timestamp with time zone', nullable: true })
  pickedUpAt: Date;

  /**
   * When driver went out for delivery
   */
  @Column({ name: 'out_for_delivery_at', type: 'timestamp with time zone', nullable: true })
  outForDeliveryAt: Date;

  /**
   * When order was delivered
   */
  @Column({ name: 'delivered_at', type: 'timestamp with time zone', nullable: true })
  deliveredAt: Date;

  /**
   * When assignment was completed
   */
  @Column({ name: 'completed_at', type: 'timestamp with time zone', nullable: true })
  completedAt: Date;

  // =========================================================================
  // DECLINE DETAILS
  // =========================================================================

  /**
   * Reason for declining assignment
   */
  @Column({
    name: 'decline_reason',
    type: 'enum',
    enum: DeclineReason,
    nullable: true,
  })
  declineReason: DeclineReason;

  /**
   * Additional decline notes
   */
  @Column({ type: 'text', nullable: true, name: 'decline_notes' })
  declineNotes: string;

  // =========================================================================
  // DELIVERY PROOF
  // =========================================================================

  /**
   * Delivery proof (photo, signature, etc.)
   */
  @Column({ type: 'jsonb', nullable: true, name: 'delivery_proof' })
  deliveryProof: DeliveryProof;

  /**
   * Who received the delivery
   */
  @Column({ name: 'delivered_to_person', nullable: true })
  deliveredToPerson: string;

  /**
   * Delivery notes from driver
   */
  @Column({ type: 'text', nullable: true, name: 'delivery_notes' })
  deliveryNotes: string;

  // =========================================================================
  // TRIP DATA
  // =========================================================================

  /**
   * Trip information
   */
  @Column({ type: 'jsonb', nullable: true, name: 'trip_data' })
  tripData: TripData;

  /**
   * Driver's starting location
   */
  @Column({ type: 'jsonb', nullable: true, name: 'start_location' })
  startLocation: {
    lat: number;
    lng: number;
    address?: string;
  };

  /**
   * Delivery destination
   */
  @Column({ type: 'jsonb', nullable: true, name: 'destination_location' })
  destinationLocation: {
    lat: number;
    lng: number;
    address: string;
  };

  // =========================================================================
  // PAYMENT COLLECTION (COD)
  // =========================================================================

  /**
   * Payment collection details for cash on delivery
   */
  @Column({ type: 'jsonb', nullable: true, name: 'payment_collection' })
  paymentCollection: PaymentCollection;

  // =========================================================================
  // ASSIGNMENT PRIORITY
  // =========================================================================

  /**
   * Priority level (1=highest, 5=lowest)
   */
  @Column({ name: 'priority_level', default: 3 })
  priorityLevel: number;

  /**
   * Whether this is a rush/expedite order
   */
  @Column({ name: 'is_rush', default: false })
  isRush: boolean;

  // =========================================================================
  // STORE & LOCATION
  // =========================================================================

  /**
   * Store ID
   */
  @Column({ name: 'store_id' })
  storeId: string;

  /**
   * Device that created the assignment
   */
  @Column({ name: 'device_id', nullable: true })
  deviceId: string;

  // =========================================================================
  // NOTES & METADATA
  // =========================================================================

  /**
   * Assignment notes (visible to driver)
   */
  @Column({ type: 'text', nullable: true, name: 'driver_notes' })
  driverNotes: string;

  /**
   * Internal notes (staff only)
   */
  @Column({ type: 'text', nullable: true, name: 'internal_notes' })
  internalNotes: string;

  /**
   * Additional metadata
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // =========================================================================
  // METHODS
  // =========================================================================

  /**
   * Accept assignment
   */
  accept(): void {
    this.status = AssignmentStatus.ACCEPTED;
    this.acceptedAt = new Date();
  }

  /**
   * Decline assignment
   */
  decline(reason: DeclineReason, notes?: string): void {
    this.status = AssignmentStatus.DECLINED;
    this.declineReason = reason;
    this.declineNotes = notes || '';
    this.declinedAt = new Date();
  }

  /**
   * Mark as picked up
   */
  markPickedUp(): void {
    this.status = AssignmentStatus.PICKED_UP;
    this.pickedUpAt = new Date();
  }

  /**
   * Mark as out for delivery
   */
  markOutForDelivery(): void {
    this.status = AssignmentStatus.OUT_FOR_DELIVERY;
    this.outForDeliveryAt = new Date();
  }

  /**
   * Mark as delivered
   */
  markDelivered(proof?: DeliveryProof): void {
    this.status = AssignmentStatus.DELIVERED;
    this.deliveredAt = new Date();
    if (proof) {
      this.deliveryProof = proof;
    }
  }

  /**
   * Mark as completed
   */
  markCompleted(): void {
    this.status = AssignmentStatus.COMPLETED;
    this.completedAt = new Date();
  }

  /**
   * Record COD payment collection
   */
  recordPayment(collection: PaymentCollection): void {
    this.paymentCollection = collection;
  }

  /**
   * Calculate actual vs estimated time
   */
  getTimeDifference(): number {
    if (!this.tripData) return 0;
    return this.tripData.actualMinutes - this.tripData.estimatedMinutes;
  }

  /**
   * Check if delivery was late
   */
  isLate(): boolean {
    const diff = this.getTimeDifference();
    return diff > 5; // More than 5 minutes late
  }

  /**
   * Get assignment duration in minutes
   */
  getDuration(): number {
    const end = this.completedAt || this.deliveredAt || new Date();
    const start = this.assignedAt;
    return Math.floor((end.getTime() - start.getTime()) / 60000);
  }
}
