import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull, Not } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import Decimal from 'decimal.js';
import { EndOfDayReport, EODStatus, SessionSummary } from '../entities/end-of-day-report.entity';
import { RegisterSession } from '../entities/register-session.entity';

@Injectable()
export class EndOfDayService {
    constructor(
        @InjectRepository(EndOfDayReport)
        private readonly eodRepo: Repository<EndOfDayReport>,
        @InjectRepository(RegisterSession)
        private readonly sessionRepo: Repository<RegisterSession>,
    ) { }

    /**
     * Start a new EOD report for a store
     * Collects all closed sessions from the business day
     * 
     * @param storeId Store to run EOD for
     * @param managerId Manager running EOD
     * @param businessDate The business day to close (may differ from calendar if after midnight)
     */
    @Transactional()
    async startEOD(storeId: string, managerId: string, businessDate?: Date): Promise<EndOfDayReport> {
        // reportDate = when EOD was run (now)
        const reportDate = new Date();

        // businessDate = the actual business day being closed
        // Default: if running after midnight (before 6 AM), assume previous day
        const now = new Date();
        const hour = now.getHours();
        const defaultBusinessDate = hour < 6
            ? new Date(now.getTime() - 24 * 60 * 60 * 1000) // Previous day
            : now;

        const bizDate = businessDate || defaultBusinessDate;
        const bizDateOnly = new Date(bizDate.toISOString().split('T')[0]);

        // Check if EOD already exists for this business date
        const existing = await this.eodRepo.findOne({
            where: { storeId, businessDate: bizDateOnly },
        });

        if (existing && existing.status === EODStatus.COMPLETED) {
            throw new BadRequestException({
                code: 'EOD_001',
                message: 'EOD report already completed for this business date',
            });
        }

        // Get all closed sessions for this store and business date
        const startOfDay = new Date(bizDateOnly);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(bizDateOnly);
        endOfDay.setHours(23, 59, 59, 999);

        // Also include sessions that closed after midnight but were opened on business date
        const nextDayCutoff = new Date(bizDateOnly);
        nextDayCutoff.setDate(nextDayCutoff.getDate() + 1);
        nextDayCutoff.setHours(6, 0, 0, 0); // Include sessions closed before 6 AM next day

        const sessions = await this.sessionRepo.find({
            where: [
                // Sessions closed during the business day
                {
                    storeId,
                    isOpen: false,
                    closedAt: Between(startOfDay, endOfDay),
                },
                // Sessions opened on business day but closed after midnight (before 6 AM)
                {
                    storeId,
                    isOpen: false,
                    openedAt: Between(startOfDay, endOfDay),
                    closedAt: Between(endOfDay, nextDayCutoff),
                },
            ],
        });

        // Check if there are still open sessions
        const openSessions = await this.sessionRepo.count({
            where: {
                storeId,
                isOpen: true,
            },
        });

        if (openSessions > 0) {
            throw new BadRequestException({
                code: 'EOD_002',
                message: `Cannot start EOD - ${openSessions} session(s) still open`,
            });
        }

        // Calculate aggregates
        const aggregates = this.calculateAggregates(sessions);

        // Create or update EOD report
        const eod = existing || new EndOfDayReport();
        eod.storeId = storeId;
        eod.reportDate = reportDate;
        eod.businessDate = bizDateOnly;
        eod.managerId = managerId;
        eod.status = EODStatus.IN_PROGRESS;
        eod.startedAt = new Date();

        // Session counts
        eod.totalSessions = sessions.length;
        eod.sessionsWithDiscrepancy = aggregates.sessionsWithDiscrepancy;

        // Cash totals
        eod.totalOpeningBalance = aggregates.totalOpeningBalance;
        eod.totalCashSales = aggregates.totalCashSales;
        eod.totalDropsToSafe = aggregates.totalDrops;
        eod.totalPettyCash = aggregates.totalPettyCash;

        // Discrepancy
        eod.totalExpectedCash = aggregates.totalExpected;
        eod.totalActualCash = aggregates.totalActual;
        eod.totalDiscrepancy = aggregates.totalDiscrepancy;

        // Session summaries for quick display
        eod.sessionSummaries = aggregates.summaries;

        return await this.eodRepo.save(eod);
    }

    /**
     * Complete the EOD report
     */
    @Transactional()
    async completeEOD(eodId: string, managerNotes?: string): Promise<EndOfDayReport> {
        const eod = await this.eodRepo.findOne({ where: { id: eodId } });

        if (!eod) {
            throw new NotFoundException({ code: 'EOD_003', message: 'EOD report not found' });
        }

        if (eod.status === EODStatus.COMPLETED) {
            throw new BadRequestException({ code: 'EOD_004', message: 'EOD already completed' });
        }

        eod.status = EODStatus.COMPLETED;
        eod.completedAt = new Date();
        if (managerNotes) {
            eod.managerNotes = managerNotes;
        }

        return await this.eodRepo.save(eod);
    }

    /**
     * Get EOD report by date
     */
    async getByDate(storeId: string, date: Date): Promise<EndOfDayReport | null> {
        const dateOnly = new Date(date.toISOString().split('T')[0]);
        return await this.eodRepo.findOne({
            where: { storeId, reportDate: dateOnly },
        });
    }

    /**
     * Get EOD report by ID
     */
    async getById(eodId: string): Promise<EndOfDayReport> {
        const eod = await this.eodRepo.findOne({ where: { id: eodId } });
        if (!eod) {
            throw new NotFoundException({ code: 'EOD_003', message: 'EOD report not found' });
        }
        return eod;
    }

    /**
     * List EOD reports for a store
     */
    async list(storeId: string, limit = 30): Promise<EndOfDayReport[]> {
        return await this.eodRepo.find({
            where: { storeId },
            order: { reportDate: 'DESC' },
            take: limit,
        });
    }

    /**
     * Get sessions awaiting review (closed but not in EOD)
     */
    async getPendingSessions(storeId: string): Promise<RegisterSession[]> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return await this.sessionRepo.find({
            where: {
                storeId,
                isOpen: false,
                closedAt: Not(IsNull()),
            },
            order: { closedAt: 'DESC' },
            take: 50,
        });
    }

    /**
     * Calculate aggregates from sessions
     */
    private calculateAggregates(sessions: RegisterSession[]): {
        totalOpeningBalance: number;
        totalCashSales: number;
        totalDrops: number;
        totalPettyCash: number;
        totalExpected: number;
        totalActual: number;
        totalDiscrepancy: number;
        sessionsWithDiscrepancy: number;
        summaries: SessionSummary[];
    } {
        let totalOpening = new Decimal(0);
        let totalCash = new Decimal(0);
        let totalDrops = new Decimal(0);
        let totalPetty = new Decimal(0);
        let totalExpected = new Decimal(0);
        let totalActual = new Decimal(0);
        let totalDisc = new Decimal(0);
        let discrepancyCount = 0;

        const summaries: SessionSummary[] = [];

        for (const session of sessions) {
            const opening = new Decimal(session.openingBalance || 0);
            const expected = new Decimal(session.expectedBalance || 0);
            const actual = new Decimal(session.actualBalance || 0);
            const discrepancy = new Decimal(session.discrepancy || 0);
            const drops = new Decimal(session.totalDrops || 0);
            const petty = new Decimal(session.totalPettyCash || 0);
            const cashSales = new Decimal(session.totalCashSales || 0);

            totalOpening = totalOpening.plus(opening);
            totalCash = totalCash.plus(cashSales);
            totalDrops = totalDrops.plus(drops);
            totalPetty = totalPetty.plus(petty);
            totalExpected = totalExpected.plus(expected);
            totalActual = totalActual.plus(actual);
            totalDisc = totalDisc.plus(discrepancy);

            const hasDisc = !discrepancy.isZero();
            if (hasDisc) discrepancyCount++;

            summaries.push({
                sessionId: session.id,
                userId: session.userId,
                userName: 'Cashier', // TODO: Join with users table
                deviceId: session.deviceId,
                openedAt: session.openedAt?.toISOString() || '',
                closedAt: session.closedAt?.toISOString() || '',
                openingBalance: opening.toFixed(3),
                expectedBalance: expected.toFixed(3),
                actualBalance: actual.toFixed(3),
                discrepancy: discrepancy.toFixed(3),
                hasDiscrepancy: hasDisc,
                notes: session.notes,
            });
        }

        return {
            totalOpeningBalance: parseFloat(totalOpening.toFixed(3)),
            totalCashSales: parseFloat(totalCash.toFixed(3)),
            totalDrops: parseFloat(totalDrops.toFixed(3)),
            totalPettyCash: parseFloat(totalPetty.toFixed(3)),
            totalExpected: parseFloat(totalExpected.toFixed(3)),
            totalActual: parseFloat(totalActual.toFixed(3)),
            totalDiscrepancy: parseFloat(totalDisc.toFixed(3)),
            sessionsWithDiscrepancy: discrepancyCount,
            summaries,
        };
    }
}
