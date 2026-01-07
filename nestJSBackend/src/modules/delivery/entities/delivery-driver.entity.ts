import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';
import { Store } from '../../organization/entities/store.entity';

/**
 * =============================================================================
 * DELIVERY DRIVER TYPES
 * =============================================================================
 */

/**
 * Driver Status
 */
export enum DriverStatus {
  AVAILABLE = 'AVAILABLE',   // Available for new orders
  BUSY = 'BUSY',             // At capacity
  OFF_DUTY = 'OFF_DUTY',     // Not working
  ON_BREAK = 'ON_BREAK',     // On break
}

/**
 * Vehicle Type
 */
export enum VehicleType {
  MOTORCYCLE = 'MOTORCYCLE',
  CAR = 'CAR',
  BICYCLE = 'BICYCLE',
  SCOOTER = 'SCOOTER',
  WALKING = 'WALKING',
}

/**
 * Driver Location
 */
export interface DriverLocation {
  lat: number;
  lng: number;
  updatedAt: Date;
  accuracy?: number;
}

/**
 * Driver Performance Metrics
 */
export interface DriverMetrics {
  totalDeliveries: number;
  onTimeDeliveries: number;
  lateDeliveries: number;
  cancelledDeliveries: number;
  averageDeliveryTime: number;      // in minutes
  averageRating: number;             // 1-5 stars
  totalRatingCount: number;
  lastDeliveryDate?: Date;
}

/**
 * =============================================================================
 * ENTITY: DeliveryDriver
 * =============================================================================
 *
 * Manages delivery drivers for restaurant POS system.
 *
 * Features:
 * - Real-time location tracking
 * - Capacity management (max concurrent orders)
 * - Zone assignment (preferred delivery zones)
 * - Performance metrics tracking
 * - Status management (available/busy/off-duty)
 *
 * @example
 * {
 *   driverName: 'Ahmed Mohamed',
 *   driverCode: 'D001',
 *   phoneNumber: '+20 123 456 7890',
 *   vehicleType: 'MOTORCYCLE',
 *   vehiclePlate: 'ABC 1234',
 *   status: 'AVAILABLE',
 *   maxConcurrentOrders: 5,
 *   currentOrderCount: 2,
 *   assignedZones: ['zone-a-id', 'zone-b-id']
 * }
 */
@Entity('delivery_drivers')
export class DeliveryDriver extends AbstractEntity {
  // =========================================================================
  // STORE RELATIONSHIP
  // =========================================================================

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ name: 'store_id' })
  storeId: string;

  // =========================================================================
  // DRIVER IDENTIFICATION
  // =========================================================================

  /**
   * Full driver name
   */
  @Column({ name: 'driver_name' })
  driverName: string;

  /**
   * Unique driver code
   * e.g., 'D001', 'D002'
   */
  @Column({ name: 'driver_code', unique: true })
  driverCode: string;

  /**
   * Phone number
   */
  @Column({ name: 'phone_number' })
  phoneNumber: string;

  /**
   * Email (optional)
   */
  @Column({ name: 'email', nullable: true })
  email: string;

  // =========================================================================
  // VEHICLE INFORMATION
  // =========================================================================

  /**
   * Type of vehicle
   */
  @Column({
    name: 'vehicle_type',
    type: 'enum',
    enum: VehicleType,
    nullable: true,
  })
  vehicleType: VehicleType;

  /**
   * Vehicle license plate
   */
  @Column({ name: 'vehicle_plate', nullable: true })
  vehiclePlate: string;

  /**
   * Vehicle make/model (optional)
   */
  @Column({ name: 'vehicle_description', nullable: true })
  vehicleDescription: string;

  // =========================================================================
  // DRIVER STATUS
  // =========================================================================

  /**
   * Current driver status
   */
  @Column({
    name: 'status',
    type: 'enum',
    enum: DriverStatus,
    default: DriverStatus.OFF_DUTY,
  })
  status: DriverStatus;

  /**
   * When current status was set
   */
  @Column({ name: 'status_since', type: 'timestamp with time zone', nullable: true })
  statusSince: Date;

  // =========================================================================
  // LOCATION TRACKING
  // =========================================================================

  /**
   * Current location (real-time tracking)
   * Updated by driver mobile app or dispatch system
   */
  @Column({ type: 'jsonb', nullable: true, name: 'current_location' })
  currentLocation: DriverLocation;

  /**
   * Last known location
   */
  @Column({ type: 'jsonb', nullable: true, name: 'last_known_location' })
  lastKnownLocation: DriverLocation;

  // =========================================================================
  // ZONE ASSIGNMENT
  // =========================================================================

  /**
   * Assigned delivery zones (preferred areas)
   * Array of zone UUIDs
   */
  @Column({ type: 'jsonb', nullable: true, name: 'assigned_zones' })
  assignedZones: string[];

  /**
   * Whether driver can accept orders outside assigned zones
   */
  @Column({ name: 'can_accept_outside_zones', default: true })
  canAcceptOutsideZones: boolean;

  // =========================================================================
  // CAPACITY MANAGEMENT
  // =========================================================================

  /**
   * Maximum concurrent orders this driver can handle
   */
  @Column({ name: 'max_concurrent_orders', default: 5 })
  maxConcurrentOrders: number;

  /**
   * Current number of active orders
   */
  @Column({ name: 'current_order_count', default: 0 })
  currentOrderCount: number;

  // =========================================================================
  // PERFORMANCE METRICS
  // =========================================================================

  /**
   * Performance statistics
   */
  @Column({ type: 'jsonb', nullable: true, name: 'metrics' })
  metrics: DriverMetrics;

  /**
   * Overall rating (1-5)
   */
  @Column({ name: 'average_rating', type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  /**
   * Total number of ratings
   */
  @Column({ name: 'total_ratings', default: 0 })
  totalRatings: number;

  // =========================================================================
  // PAYMENT INFORMATION
  // =========================================================================

  /**
   * Payment type
   * e.g., 'SALARY', 'PER_DELIVERY', 'COMMISSION'
   */
  @Column({ name: 'payment_type', nullable: true })
  paymentType: string;

  /**
   * Payment rate
   * Depends on payment_type:
   * - SALARY: monthly amount
   * - PER_DELIVERY: amount per delivery
   * - COMMISSION: percentage
   */
  @Column({
    name: 'payment_rate',
    type: 'decimal',
    precision: 10,
    scale: 3,
    nullable: true,
  })
  paymentRate: number;

  // =========================================================================
  // ACTIVITY & AVAILABILITY
  // =========================================================================

  /**
   * Whether driver is active
   * Inactive drivers are hidden from assignment UI
   */
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  /**
   * Working hours (JSONB)
   * e.g., { start: '09:00', end: '22:00', days: [1,2,3,4,5,6] }
   */
  @Column({ type: 'jsonb', nullable: true, name: 'working_hours' })
  workingHours: {
    start: string;
    end: string;
    days: number[];  // 0=Sunday, 6=Saturday
  };

  /**
   * Shift assignment
   */
  @Column({ name: 'shift_id', nullable: true })
  shiftId: string;

  // =========================================================================
  // NOTES & METADATA
  // =========================================================================

  /**
   * Notes about driver
   */
  @Column({ type: 'text', nullable: true })
  notes: string;

  /**
   * Emergency contact
   */
  @Column({ type: 'jsonb', nullable: true, name: 'emergency_contact' })
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };

  /**
   * Additional metadata
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // =========================================================================
  // HIRING INFORMATION
  // =========================================================================

  /**
   * Hire date
   */
  @Column({ name: 'hire_date', type: 'timestamp with time zone', nullable: true })
  hireDate: Date;

  /**
   * Termination date (if applicable)
   */
  @Column({ name: 'termination_date', type: 'timestamp with time zone', nullable: true })
  terminationDate: Date;

  // =========================================================================
  // METHODS
  // =========================================================================

  /**
   * Check if driver can accept more orders
   */
  canAcceptOrder(): boolean {
    return this.isActive &&
           this.status === DriverStatus.AVAILABLE &&
           this.currentOrderCount < this.maxConcurrentOrders;
  }

  /**
   * Assign an order to driver
   */
  assignOrder(): void {
    this.currentOrderCount++;
    if (this.currentOrderCount >= this.maxConcurrentOrders) {
      this.status = DriverStatus.BUSY;
    }
  }

  /**
   * Mark order as completed (free up capacity)
   */
  completeOrder(): void {
    this.currentOrderCount = Math.max(0, this.currentOrderCount - 1);
    if (this.currentOrderCount < this.maxConcurrentOrders && this.status === DriverStatus.BUSY) {
      this.status = DriverStatus.AVAILABLE;
    }
  }

  /**
   * Update driver location
   */
  updateLocation(location: DriverLocation): void {
    this.lastKnownLocation = this.currentLocation;
    this.currentLocation = location;
  }

  /**
   * Set driver status
   */
  setStatus(status: DriverStatus): void {
    this.status = status;
    this.statusSince = new Date();
  }

  /**
   * Get on-time delivery percentage
   */
  getOnTimePercentage(): number {
    if (!this.metrics || this.metrics.totalDeliveries === 0) {
      return 0;
    }
    return (this.metrics.onTimeDeliveries / this.metrics.totalDeliveries) * 100;
  }

  /**
   * Get average delivery time in minutes
   */
  getAverageDeliveryTime(): number {
    return this.metrics?.averageDeliveryTime || 0;
  }

  /**
   * Check if driver is working now
   */
  isWorkingNow(): boolean {
    if (!this.workingHours) {
      return this.isActive;
    }

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = this.workingHours.start.split(':').map(Number);
    const [endHour, endMin] = this.workingHours.end.split(':').map(Number);
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    return this.workingHours.days.includes(currentDay) &&
           currentTime >= startTime &&
           currentTime <= endTime;
  }
}
