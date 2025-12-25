import { getWhere } from '../src'
import { IsNull, Like, Between, ObjectLiteral, ILike, Not } from 'typeorm'
import { Repository } from 'typeorm';

type MockRepository<T extends ObjectLiteral = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;
const createMockRepository = <T extends ObjectLiteral>(): MockRepository<T> => ({
    find: jest.fn(),
});
const createRepo = () => ({
    find: jest.fn(),
});


describe('getWhere + TypeORM Repository', () => {
    it('eq', async () => {
        const repository = createRepo();

        const where = getWhere(
            [
                {
                    isNested: false,
                    property: 'name',
                    rule: 'eq',
                    value: 'Amir',
                },
            ],
            { orm: 'typeorm' }
        );

        await repository.find({ where });

        const callArg = repository.find.mock.calls[0][0];

        expect(callArg.where.name).toBe('Amir');
    });

    it('like', async () => {
        const repository = createRepo();

        const where = getWhere(
            [
                {
                    isNested: false,
                    property: 'name',
                    rule: 'like',
                    value: 'Amir',
                },
            ],
            { orm: 'typeorm' }
        );

        await repository.find({ where });

        const callArg = repository.find.mock.calls[0][0];

        expect(callArg.where.name).toBeInstanceOf(
            Like('%x%').constructor
        );
        expect(callArg.where.name.value).toBe('%Amir%');
    });

    it('ilike', async () => {
        const repository = createRepo();

        const where = getWhere(
            [
                {
                    isNested: false,
                    property: 'name',
                    rule: 'ilike',
                    value: 'Amir',
                },
            ],
            { orm: 'typeorm' }
        );

        await repository.find({ where });

        const callArg = repository.find.mock.calls[0][0];

        expect(callArg.where.name).toBeInstanceOf(
            ILike('%x%').constructor
        );
        expect(callArg.where.name.value).toBe('%Amir%');
    });

    it('nilike', async () => {
        const repository = createRepo();

        const where = getWhere(
            [
                {
                    isNested: false,
                    property: 'name',
                    rule: 'nilike',
                    value: 'Amir',
                },
            ],
            { orm: 'typeorm' }
        );

        await repository.find({ where });

        const callArg = repository.find.mock.calls[0][0];

        expect(callArg.where.name).toBeInstanceOf(
            Not(ILike('%x%')).constructor
        );
        expect(callArg.where.name.value).toBe('%Amir%');
    });

    it('nlike', async () => {
        const repository = createRepo();

        const where = getWhere(
            [
                {
                    isNested: false,
                    property: 'name',
                    rule: 'like',
                    value: 'Amir',
                },
            ],
            { orm: 'typeorm' }
        );

        await repository.find({ where });

        const callArg = repository.find.mock.calls[0][0];

        expect(callArg.where.name).toBeInstanceOf(
            Not(Like('%x%')).constructor
        );
        expect(callArg.where.name.value).toBe('%Amir%');
    });
});