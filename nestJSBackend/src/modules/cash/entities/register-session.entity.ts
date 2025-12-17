import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../../../common/entities/abstract.entity';

@Entity('register_sessions')
export class RegisterSession extends AbstractEntity {
    @Column({ name: 'is_open', default: true })
    isOpen: boolean;

    // Add more fields when implementing Cash Module
}
