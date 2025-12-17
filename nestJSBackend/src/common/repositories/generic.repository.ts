import { Repository, ObjectLiteral } from 'typeorm';

export class GenericRepository<T extends ObjectLiteral> extends Repository<T> { }
