import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowDefinition, WorkflowType } from '../../modules/workflow/entities/workflow-definition.entity';
import { WorkflowState, StateType } from '../../modules/workflow/entities/workflow-state.entity';
import { WorkflowTransition } from '../../modules/workflow/entities/workflow-transition.entity';

/**
 * Workflow Seed Service
 * Seeds default configurable workflows for all business process types
 */
@Injectable()
export class SeedWorkflowService {
    private readonly logger = new Logger(SeedWorkflowService.name);

    constructor(
        @InjectRepository(WorkflowDefinition)
        private readonly workflowRepo: Repository<WorkflowDefinition>,
        @InjectRepository(WorkflowState)
        private readonly stateRepo: Repository<WorkflowState>,
        @InjectRepository(WorkflowTransition)
        private readonly transitionRepo: Repository<WorkflowTransition>,
    ) { }

    async seed(): Promise<void> {
        this.logger.log('Seeding default workflows...');

        // Check if already seeded
        const existing = await this.workflowRepo.count();
        if (existing > 0) {
            this.logger.log(`Workflows already exist (${existing}), skipping seed`);
            return;
        }

        // Seed all default workflows
        await this.seedOrderWorkflow();
        await this.seedSessionCloseWorkflow();
        await this.seedEndOfDayWorkflow();
        await this.seedKitchenTicketWorkflow();
        await this.seedRefundWorkflow();

        this.logger.log('Default workflows seeded successfully');
    }

    // =========================================================================
    // ORDER WORKFLOW
    // =========================================================================
    private async seedOrderWorkflow(): Promise<void> {
        const workflow = await this.workflowRepo.save({
            workflowName: 'Standard Order Flow',
            workflowType: WorkflowType.ORDER,
            isActive: true,
            isDefault: true,
            translations: {
                en: { name: 'Standard Order Flow', description: 'Default restaurant order workflow' },
                ar: { name: 'سير الطلب القياسي', description: 'سير العمل الافتراضي للمطعم' },
            },
        });

        // States
        const states = [
            { stateKey: 'DRAFT', stateType: StateType.INITIAL, color: '#6B7280', icon: 'pencil', displayOrder: 1, translations: { en: { label: 'Draft' }, ar: { label: 'مسودة' } } },
            { stateKey: 'ACTIVE', stateType: StateType.INTERMEDIATE, color: '#3B82F6', icon: 'shopping-cart', displayOrder: 2, translations: { en: { label: 'Active' }, ar: { label: 'نشط' } } },
            { stateKey: 'PREPARING', stateType: StateType.INTERMEDIATE, color: '#F59E0B', icon: 'fire', displayOrder: 3, translations: { en: { label: 'Preparing' }, ar: { label: 'قيد التحضير' } }, onEnterActions: { notify_kitchen: true } },
            { stateKey: 'READY', stateType: StateType.INTERMEDIATE, color: '#10B981', icon: 'check-circle', displayOrder: 4, translations: { en: { label: 'Ready' }, ar: { label: 'جاهز' } }, onEnterActions: { notify_server: true } },
            { stateKey: 'COMPLETED', stateType: StateType.TERMINAL, color: '#059669', icon: 'check', displayOrder: 5, translations: { en: { label: 'Completed' }, ar: { label: 'مكتمل' } }, onEnterActions: { generate_invoice: true, update_inventory: true } },
            { stateKey: 'VOIDED', stateType: StateType.TERMINAL, color: '#EF4444', icon: 'x-circle', displayOrder: 6, translations: { en: { label: 'Voided' }, ar: { label: 'ملغي' } } },
        ];

        for (const state of states) {
            await this.stateRepo.save({ workflow: { id: workflow.id }, ...state });
        }

        // Transitions
        const transitions = [
            { fromStateKey: 'DRAFT', toStateKey: 'ACTIVE', translations: { en: { label: 'Confirm Order' }, ar: { label: 'تأكيد الطلب' } } },
            { fromStateKey: 'ACTIVE', toStateKey: 'PREPARING', translations: { en: { label: 'Send to Kitchen' }, ar: { label: 'إرسال للمطبخ' } }, triggerActions: { create_kitchen_tickets: true } },
            { fromStateKey: 'PREPARING', toStateKey: 'READY', translations: { en: { label: 'Mark Ready' }, ar: { label: 'جاهز' } } },
            { fromStateKey: 'READY', toStateKey: 'COMPLETED', translations: { en: { label: 'Complete Order' }, ar: { label: 'إتمام الطلب' } }, conditionLogic: { '==': [{ 'var': 'payment_status' }, 'PAID'] } },
            { fromStateKey: '*', toStateKey: 'VOIDED', translations: { en: { label: 'Void Order' }, ar: { label: 'إلغاء الطلب' } }, requiresApproval: true, requiredPermissions: ['orders.void'] },
        ];

        for (let i = 0; i < transitions.length; i++) {
            await this.transitionRepo.save({ workflow: { id: workflow.id }, ...transitions[i], displayOrder: i + 1 });
        }

        this.logger.log('✓ Order workflow seeded');
    }

    // =========================================================================
    // SESSION CLOSE WORKFLOW (Blind Count)
    // =========================================================================
    private async seedSessionCloseWorkflow(): Promise<void> {
        const workflow = await this.workflowRepo.save({
            workflowName: 'Cashier Session Close',
            workflowType: WorkflowType.SESSION_CLOSE,
            isActive: true,
            isDefault: true,
            translations: {
                en: { name: 'Cashier Session Close', description: 'Blind count cash drawer close process' },
                ar: { name: 'إغلاق جلسة الكاشير', description: 'عملية إغلاق الدرج النقدي' },
            },
        });

        const states = [
            { stateKey: 'OPEN', stateType: StateType.INITIAL, color: '#10B981', icon: 'play-circle', displayOrder: 1, translations: { en: { label: 'Open' }, ar: { label: 'مفتوح' } } },
            { stateKey: 'COUNTING', stateType: StateType.INTERMEDIATE, color: '#F59E0B', icon: 'calculator', displayOrder: 2, translations: { en: { label: 'Counting' }, ar: { label: 'جاري العد' } } },
            { stateKey: 'PENDING_REVIEW', stateType: StateType.INTERMEDIATE, color: '#8B5CF6', icon: 'eye', displayOrder: 3, translations: { en: { label: 'Pending Review' }, ar: { label: 'بانتظار المراجعة' } } },
            { stateKey: 'CLOSED', stateType: StateType.TERMINAL, color: '#6B7280', icon: 'lock', displayOrder: 4, translations: { en: { label: 'Closed' }, ar: { label: 'مغلق' } }, onEnterActions: { archive_session: true } },
        ];

        for (const state of states) {
            await this.stateRepo.save({ workflow: { id: workflow.id }, ...state });
        }

        const transitions = [
            { fromStateKey: 'OPEN', toStateKey: 'COUNTING', translations: { en: { label: 'Start Count' }, ar: { label: 'بدء العد' } } },
            {
                fromStateKey: 'COUNTING',
                toStateKey: 'PENDING_REVIEW',
                translations: { en: { label: 'Submit Count' }, ar: { label: 'تقديم العد' } },
                triggerActions: { calculate_discrepancy: true, reveal_expected: true }
            },
            {
                fromStateKey: 'PENDING_REVIEW',
                toStateKey: 'CLOSED',
                translations: { en: { label: 'Approve & Close' }, ar: { label: 'موافقة وإغلاق' } },
                conditionLogic: {
                    'or': [
                        { '<=': [{ 'abs': { 'var': 'discrepancy' } }, 5] },
                        { '!==': [{ 'var': 'notes' }, ''] }
                    ]
                },
                requiredPermissions: ['session.approve']
            },
        ];

        for (let i = 0; i < transitions.length; i++) {
            await this.transitionRepo.save({ workflow: { id: workflow.id }, ...transitions[i], displayOrder: i + 1 });
        }

        this.logger.log('✓ Session Close workflow seeded');
    }

    // =========================================================================
    // END OF DAY WORKFLOW
    // =========================================================================
    private async seedEndOfDayWorkflow(): Promise<void> {
        const workflow = await this.workflowRepo.save({
            workflowName: 'Manager End of Day',
            workflowType: WorkflowType.END_OF_DAY,
            isActive: true,
            isDefault: true,
            translations: {
                en: { name: 'Manager End of Day', description: 'Aggregate all cashier sessions for daily close' },
                ar: { name: 'نهاية اليوم للمدير', description: 'تجميع جميع جلسات الكاشير للإغلاق اليومي' },
            },
        });

        const states = [
            { stateKey: 'PENDING', stateType: StateType.INITIAL, color: '#6B7280', icon: 'clock', displayOrder: 1, translations: { en: { label: 'Pending' }, ar: { label: 'معلق' } } },
            { stateKey: 'COLLECTING', stateType: StateType.INTERMEDIATE, color: '#3B82F6', icon: 'clipboard-list', displayOrder: 2, translations: { en: { label: 'Collecting' }, ar: { label: 'جمع البيانات' } }, onEnterActions: { aggregate_sessions: true } },
            { stateKey: 'RECONCILING', stateType: StateType.INTERMEDIATE, color: '#F59E0B', icon: 'scale', displayOrder: 3, translations: { en: { label: 'Reconciling' }, ar: { label: 'المطابقة' } }, onEnterActions: { generate_eod_report: true } },
            { stateKey: 'COMPLETED', stateType: StateType.TERMINAL, color: '#10B981', icon: 'check-circle', displayOrder: 4, translations: { en: { label: 'Completed' }, ar: { label: 'مكتمل' } }, onEnterActions: { archive_day: true, reset_for_new_day: true } },
        ];

        for (const state of states) {
            await this.stateRepo.save({ workflow: { id: workflow.id }, ...state });
        }

        const transitions = [
            {
                fromStateKey: 'PENDING',
                toStateKey: 'COLLECTING',
                translations: { en: { label: 'Start EOD' }, ar: { label: 'بدء نهاية اليوم' } },
                conditionLogic: { '==': [{ 'var': 'open_sessions_count' }, 0] },
                requiredPermissions: ['eod.start']
            },
            { fromStateKey: 'COLLECTING', toStateKey: 'RECONCILING', translations: { en: { label: 'Review Totals' }, ar: { label: 'مراجعة المجاميع' } } },
            {
                fromStateKey: 'RECONCILING',
                toStateKey: 'COMPLETED',
                translations: { en: { label: 'Complete EOD' }, ar: { label: 'إكمال نهاية اليوم' } },
                requiredPermissions: ['eod.complete']
            },
        ];

        for (let i = 0; i < transitions.length; i++) {
            await this.transitionRepo.save({ workflow: { id: workflow.id }, ...transitions[i], displayOrder: i + 1 });
        }

        this.logger.log('✓ End of Day workflow seeded');
    }

    // =========================================================================
    // KITCHEN TICKET WORKFLOW
    // =========================================================================
    private async seedKitchenTicketWorkflow(): Promise<void> {
        const workflow = await this.workflowRepo.save({
            workflowName: 'Kitchen Ticket Flow',
            workflowType: WorkflowType.KITCHEN_TICKET,
            isActive: true,
            isDefault: true,
            translations: {
                en: { name: 'Kitchen Ticket Flow', description: 'Kitchen display ticket lifecycle' },
                ar: { name: 'سير التذاكر في المطبخ', description: 'دورة حياة تذاكر شاشة المطبخ' },
            },
        });

        const states = [
            { stateKey: 'PENDING', stateType: StateType.INITIAL, color: '#6B7280', icon: 'inbox', displayOrder: 1, translations: { en: { label: 'Pending' }, ar: { label: 'معلق' } } },
            { stateKey: 'FIRED', stateType: StateType.INTERMEDIATE, color: '#EF4444', icon: 'fire', displayOrder: 2, translations: { en: { label: 'Fired' }, ar: { label: 'تم الإرسال' } }, onEnterActions: { start_timer: true, play_alert: true } },
            { stateKey: 'PREPARING', stateType: StateType.INTERMEDIATE, color: '#F59E0B', icon: 'clock', displayOrder: 3, translations: { en: { label: 'Preparing' }, ar: { label: 'قيد التحضير' } } },
            { stateKey: 'READY', stateType: StateType.INTERMEDIATE, color: '#10B981', icon: 'check', displayOrder: 4, translations: { en: { label: 'Ready' }, ar: { label: 'جاهز' } }, onEnterActions: { stop_timer: true, notify_server: true } },
            { stateKey: 'SERVED', stateType: StateType.TERMINAL, color: '#059669', icon: 'check-circle', displayOrder: 5, translations: { en: { label: 'Served' }, ar: { label: 'تم التقديم' } } },
            { stateKey: 'CANCELLED', stateType: StateType.TERMINAL, color: '#DC2626', icon: 'x-circle', displayOrder: 6, translations: { en: { label: 'Cancelled' }, ar: { label: 'ملغي' } } },
        ];

        for (const state of states) {
            await this.stateRepo.save({ workflow: { id: workflow.id }, ...state });
        }

        const transitions = [
            { fromStateKey: 'PENDING', toStateKey: 'FIRED', translations: { en: { label: 'Fire' }, ar: { label: 'إرسال' } } },
            { fromStateKey: 'FIRED', toStateKey: 'PREPARING', translations: { en: { label: 'Start Prep' }, ar: { label: 'بدء التحضير' } } },
            { fromStateKey: 'PREPARING', toStateKey: 'READY', translations: { en: { label: 'Bump' }, ar: { label: 'جاهز' } } },
            { fromStateKey: 'READY', toStateKey: 'SERVED', translations: { en: { label: 'Served' }, ar: { label: 'تم التقديم' } } },
            { fromStateKey: '*', toStateKey: 'CANCELLED', translations: { en: { label: 'Cancel' }, ar: { label: 'إلغاء' } }, requiresApproval: true },
        ];

        for (let i = 0; i < transitions.length; i++) {
            await this.transitionRepo.save({ workflow: { id: workflow.id }, ...transitions[i], displayOrder: i + 1 });
        }

        this.logger.log('✓ Kitchen Ticket workflow seeded');
    }

    // =========================================================================
    // REFUND WORKFLOW
    // =========================================================================
    private async seedRefundWorkflow(): Promise<void> {
        const workflow = await this.workflowRepo.save({
            workflowName: 'Refund Approval',
            workflowType: WorkflowType.REFUND,
            isActive: true,
            isDefault: true,
            translations: {
                en: { name: 'Refund Approval', description: 'Manager approval workflow for refunds' },
                ar: { name: 'الموافقة على الاسترداد', description: 'سير عمل موافقة المدير على الاسترداد' },
            },
        });

        const states = [
            { stateKey: 'REQUESTED', stateType: StateType.INITIAL, color: '#F59E0B', icon: 'undo', displayOrder: 1, translations: { en: { label: 'Requested' }, ar: { label: 'مطلوب' } } },
            { stateKey: 'PENDING_APPROVAL', stateType: StateType.INTERMEDIATE, color: '#8B5CF6', icon: 'user-check', displayOrder: 2, translations: { en: { label: 'Pending Approval' }, ar: { label: 'بانتظار الموافقة' } } },
            { stateKey: 'APPROVED', stateType: StateType.INTERMEDIATE, color: '#10B981', icon: 'check', displayOrder: 3, translations: { en: { label: 'Approved' }, ar: { label: 'موافق عليه' } } },
            { stateKey: 'PROCESSED', stateType: StateType.TERMINAL, color: '#059669', icon: 'check-circle', displayOrder: 4, translations: { en: { label: 'Processed' }, ar: { label: 'تمت المعالجة' } }, onEnterActions: { process_refund: true, update_inventory: true } },
            { stateKey: 'REJECTED', stateType: StateType.TERMINAL, color: '#EF4444', icon: 'x-circle', displayOrder: 5, translations: { en: { label: 'Rejected' }, ar: { label: 'مرفوض' } } },
        ];

        for (const state of states) {
            await this.stateRepo.save({ workflow: { id: workflow.id }, ...state });
        }

        const transitions = [
            { fromStateKey: 'REQUESTED', toStateKey: 'PENDING_APPROVAL', translations: { en: { label: 'Submit for Approval' }, ar: { label: 'تقديم للموافقة' } } },
            { fromStateKey: 'PENDING_APPROVAL', toStateKey: 'APPROVED', translations: { en: { label: 'Approve' }, ar: { label: 'موافقة' } }, requiredPermissions: ['refunds.approve'], requiresApproval: true },
            { fromStateKey: 'PENDING_APPROVAL', toStateKey: 'REJECTED', translations: { en: { label: 'Reject' }, ar: { label: 'رفض' } }, requiredPermissions: ['refunds.approve'] },
            { fromStateKey: 'APPROVED', toStateKey: 'PROCESSED', translations: { en: { label: 'Process Refund' }, ar: { label: 'معالجة الاسترداد' } } },
        ];

        for (let i = 0; i < transitions.length; i++) {
            await this.transitionRepo.save({ workflow: { id: workflow.id }, ...transitions[i], displayOrder: i + 1 });
        }

        this.logger.log('✓ Refund workflow seeded');
    }
}
