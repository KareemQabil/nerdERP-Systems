import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../modules/users/entities/user.entity';
import { Request } from 'express';

/**
 * Audit Log Service
 *
 * Provides logging for all sensitive operations in the system.
 * Creates immutable audit trail entries for:
 * - CREATE, UPDATE, DELETE operations
 * - VOID, REFUND operations
 * - Authorization events (manager PIN usage)
 * - Configuration changes
 */
@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
  ) { }

  /**
   * Log an action to the audit trail
   *
   * @param params Audit log parameters
   * @returns The created AuditLog entry
   */
  async logAction(params: {
    entityName: string;
    entityId: string;
    action: string;
    oldValues?: Record<string, any>;
    newValues: Record<string, any>;
    userId: string;
    userName: string;
    ipAddress?: string;
    deviceId?: string;
    storeId?: string;
    authorizedBy?: string; // User ID who authorized the action (via PIN)
    authorizationReason?: string; // Reason provided during authorization
  }): Promise<AuditLog> {
    const logEntry = this.auditLogRepo.create({
      entityName: params.entityName,
      entityId: params.entityId,
      action: params.action,
      oldValues: params.oldValues || undefined,
      newValues: params.newValues,
      userId: params.userId,
      userName: params.userName,
      ipAddress: params.ipAddress || this.extractIpFromContext(),
      deviceId: params.deviceId,
      storeId: params.storeId,
    });

    // If authorized by someone else (manager PIN), include in newValues
    if (params.authorizedBy) {
      logEntry.newValues = {
        ...logEntry.newValues,
        _authorizedBy: params.authorizedBy,
        _authorizationReason: params.authorizationReason,
      };
    }

    return await this.auditLogRepo.save(logEntry);
  }

  /**
   * Log a void operation (item or order)
   */
  async logVoidOperation(params: {
    entityType: 'ORDER_ITEM' | 'ORDER';
    entityId: string;
    entitySnapshot: Record<string, any>;
    reason: string;
    requestedBy: {
      id: string;
      name: string;
    };
    authorizedBy: {
      id: string;
      name: string;
    };
    ipAddress?: string;
    deviceId?: string;
    storeId?: string;
  }): Promise<AuditLog> {
    return this.logAction({
      entityName: params.entityType,
      entityId: params.entityId,
      action: 'VOID',
      oldValues: params.entitySnapshot,
      newValues: {
        voidReason: params.reason,
        voidedAt: new Date().toISOString(),
        requestedBy: params.requestedBy,
        authorizedBy: params.authorizedBy,
      },
      userId: params.requestedBy.id,
      userName: params.requestedBy.name,
      ipAddress: params.ipAddress,
      deviceId: params.deviceId,
      storeId: params.storeId,
      authorizedBy: params.authorizedBy.id,
      authorizationReason: params.reason,
    });
  }

  /**
   * Log a refund operation
   */
  async logRefundOperation(params: {
    paymentId: string;
    orderId: string;
    refundAmount: number;
    reason: string;
    processedBy: {
      id: string;
      name: string;
    };
    authorizedBy: {
      id: string;
      name: string;
    };
    ipAddress?: string;
    deviceId?: string;
    storeId?: string;
  }): Promise<AuditLog> {
    return this.logAction({
      entityName: 'PAYMENT',
      entityId: params.paymentId,
      action: 'REFUND',
      oldValues: {
        orderId: params.orderId,
        refundAmount: params.refundAmount,
      },
      newValues: {
        refundReason: params.reason,
        refundedAt: new Date().toISOString(),
        processedBy: params.processedBy,
        authorizedBy: params.authorizedBy,
      },
      userId: params.processedBy.id,
      userName: params.processedBy.name,
      ipAddress: params.ipAddress,
      deviceId: params.deviceId,
      storeId: params.storeId,
      authorizedBy: params.authorizedBy.id,
      authorizationReason: params.reason,
    });
  }

  /**
   * Log an authorization event (manager PIN usage)
   */
  async logAuthorizationEvent(params: {
    action: string; // VOID_ITEM, APPLY_DISCOUNT, etc.
    authorizedBy: {
      id: string;
      name: string;
    };
    requestedBy: {
      id: string;
      name: string;
    };
    targetEntity?: {
      entityType: string;
      entityId: string;
      entityName?: string;
    };
    reason?: string;
    ipAddress?: string;
    deviceId?: string;
    storeId?: string;
  }): Promise<AuditLog> {
    return this.logAction({
      entityName: params.targetEntity?.entityType || 'AUTHORIZATION',
      entityId: params.targetEntity?.entityId || 'N/A',
      action: params.action,
      oldValues: undefined,
      newValues: {
        authorizedBy: params.authorizedBy,
        requestedBy: params.requestedBy,
        targetEntity: params.targetEntity,
        reason: params.reason,
        authorizedAt: new Date().toISOString(),
      },
      userId: params.requestedBy.id,
      userName: params.requestedBy.name,
      ipAddress: params.ipAddress,
      deviceId: params.deviceId,
      storeId: params.storeId,
      authorizedBy: params.authorizedBy.id,
      authorizationReason: params.reason,
    });
  }

  /**
   * Get audit history for an entity
   */
  async getEntityHistory(params: {
    entityName: string;
    entityId: string;
    limit?: number;
  }): Promise<AuditLog[]> {
    const query = this.auditLogRepo.createQueryBuilder('log')
      .where('log.entityName = :entityName', { entityName: params.entityName })
      .andWhere('log.entityId = :entityId', { entityId: params.entityId })
      .orderBy('log.createdAt', 'DESC');

    if (params.limit) {
      query.limit(params.limit);
    }

    return await query.getMany();
  }

  /**
   * Get audit history for a user
   */
  async getUserHistory(params: {
    userId: string;
    actions?: string[];
    limit?: number;
    offset?: number;
  }): Promise<{ logs: AuditLog[]; total: number }> {
    const query = this.auditLogRepo.createQueryBuilder('log')
      .where('log.userId = :userId', { userId: params.userId });

    if (params.actions && params.actions.length > 0) {
      query.andWhere('log.action IN (:...actions)', { actions: params.actions });
    }

    const total = await query.getCount();

    query
      .orderBy('log.createdAt', 'DESC')
      .skip(params.offset || 0)
      .limit(params.limit || 50);

    const logs = await query.getMany();

    return { logs, total };
  }

  /**
   * Get void operations report
   */
  async getVoidReport(params: {
    storeId?: string;
    userId?: string;
    fromDate: Date;
    toDate: Date;
    limit?: number;
  }): Promise<{
    totalVoidedItems: number;
    totalVoidAmount: number;
    voidByReason: Record<string, number>;
    voidByUser: Record<string, number>;
    details: AuditLog[];
  }> {
    const query = this.auditLogRepo.createQueryBuilder('log')
      .where('log.action = :action', { action: 'VOID' })
      .andWhere('log.createdAt >= :fromDate', { fromDate: params.fromDate })
      .andWhere('log.createdAt <= :toDate', { toDate: params.toDate });

    if (params.storeId) {
      query.andWhere('log.storeId = :storeId', { storeId: params.storeId });
    }

    if (params.userId) {
      query.andWhere('log.userId = :userId', { userId: params.userId });
    }

    query.orderBy('log.createdAt', 'DESC');

    if (params.limit) {
      query.limit(params.limit);
    }

    const logs = await query.getMany();

    // Calculate statistics
    const totalVoidedItems = logs.length;
    let totalVoidAmount = 0;

    const voidByReason: Record<string, number> = {};
    const voidByUser: Record<string, number> = {};

    for (const log of logs) {
      // Count by reason
      const reason = log.newValues?.voidReason || 'UNKNOWN';
      voidByReason[reason] = (voidByReason[reason] || 0) + 1;

      // Count by user
      const userName = log.userName;
      voidByUser[userName] = (voidByUser[userName] || 0) + 1;

      // Calculate void amount (if available)
      if (log.oldValues?.lineTotal) {
        totalVoidAmount += parseFloat(log.oldValues.lineTotal);
      } else if (log.oldValues?.totalGross) {
        totalVoidAmount += parseFloat(log.oldValues.totalGross);
      }
    }

    return {
      totalVoidedItems,
      totalVoidAmount,
      voidByReason,
      voidByUser,
      details: logs,
    };
  }

  /**
   * Extract IP address from request context
   * This is a placeholder - in real implementation, get from request object
   */
  private extractIpFromContext(): string {
    return 'SYSTEM'; // In real implementation, extract from Request object
  }
}
