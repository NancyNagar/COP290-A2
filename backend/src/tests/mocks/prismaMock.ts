// src/tests/mocks/prismaMock.ts
// Central mock for all Prisma models used across tests.
// Every method is a jest.fn() so individual tests can override
// the return value with .mockResolvedValueOnce(...).

// src/tests/mocks/prisma.ts

const prismaMock = {
    user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
    },
    project: {
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    projectMember: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        upsert: jest.fn(),
        deleteMany: jest.fn(),
    },
    task: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
    },
    column: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
    },
    board: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    comment: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    auditLog: {
        create: jest.fn(),
    },
    notification: {
        create: jest.fn(),
    },
    refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
    },
    $transaction: jest.fn(),
};

export default prismaMock;